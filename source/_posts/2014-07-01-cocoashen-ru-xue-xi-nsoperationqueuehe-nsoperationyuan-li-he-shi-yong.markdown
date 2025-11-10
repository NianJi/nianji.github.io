---
layout: post
title: "Cocoa深入学习:NSOperationQueue、NSRunLoop和线程安全"
date: 2014-07-01 11:32:20 +0800
comments: true
categories: NSOperationQueue NSRunLoop 线程安全
---

目前在 iOS 和 OS X 中有两套先进的同步 API 可供我们使用：NSOperation 和 GCD 。其中 GCD 是基于 C 的底层的 API ，而 NSOperation 则是 GCD 实现的 Objective-C API。 虽然 NSOperation 是基于 GCD 实现的， 但是并不意味着它是一个 GCD 的 "dumbed-down" 版本， 相反，我们可以用NSOperation 轻易的实现一些 GCD 要写大量代码的事情。 因此， NSOperationQueue 是被推荐使用的， 除非你遇到了 NSOperationQueue 不能实现的问题。

<!-- more -->

## 1. 为什么优先使用NSOperationQueue而不是GCD

曾经我有一段时间我非常喜欢使用GCD来进行并发编程，因为虽然它是C的api，但是使用起来却非常简单和方便, 不过这样也就容易使开发者忘记并发编程中的许多注意事项和陷阱。

比如你可能写过类似这样的代码(这样来请求网络数据)：

``` objc
dispatch_async(_Queue, ^{
	
	//请求数据
	NSData *data = [NSData dataWithContentURL:[NSURL URLWithString:@"http://domain.com/a.png"]];
        
    dispatch_async(dispatch_get_main_queue(), ^{
             
         [self refreshViews:data];
    });
});
```

没错，它是可以正常的工作，但是有个致命的问题：**这个任务是无法取消的** `dataWithContentURL:`是同步的拉取数据，它会一直阻塞线程直到完成请求，如果是遇到了超时的情况，它在这个时间内会一直占有这个线程；在这个期间并发队列就需要为其他任务新建线程，这样可能导致性能下降等问题。

因此我们不推荐这种写法来从网络拉取数据。

操作队列（operation queue）是由 GCD 提供的一个队列模型的 Cocoa 抽象。GCD 提供了更加底层的控制，而操作队列则在 GCD 之上实现了一些方便的功能，这些功能对于 app 的开发者来说通常是最好最安全的选择。NSOperationQueue相对于GCD来说有以下优点：

* 提供了在 GCD 中不那么容易复制的有用特性。
* 可以很方便的取消一个NSOperation的执行
* 可以更容易的添加任务的依赖关系
* 提供了任务的状态：isExecuteing, isFinished.

** 名词： 本文中提到的 “任务”， “操作” 即代表要再NSOperation中执行的事情。 **

## 2. Operation Queues的使用

### 2.1 NSOperationQueue

`NSOperationQueue` 有两种不同类型的队列：主队列和自定义队列。主队列运行在主线程之上，而自定义队列在后台执行。在两种类型中，这些队列所处理的任务都使用 `NSOperation` 的子类来表述。

``` objc
	NSOperationQueue *mainQueue = [NSOperationQueue mainQueue]; 	//主队列
	NSOperationQueue *queue = [[NSOperationQueue alloc] init]; //自定义队列
	NSBlockOperation *operation = [NSBlockOperation blockOperationWithBlock:^{
                    //任务执行
                }];
    [queue addOperation:operation];
```

我们可以通过设置 `maxConcurrentOperationCount` 属性来控制并发任务的数量，当设置为 `1` 时， 那么它就是一个串行队列。主对列默认是串行队列，这一点和 `dispatch_queue_t` 是相似的。

### 2.2 NSOperation

你可以使用系统提供的一些现成的 `NSOperation` 的子类， 如 `NSBlockOperation`、 `NSInvocationOperation` 等（如上例子）。你也可以实现自己的子类， 通过重写 `main` 或者 `start` 方法 来定义自己的 operations 。

使用 `main` 方法非常简单，开发者不需要管理一些状态属性（例如 isExecuting 和 isFinished），当 main 方法返回的时候，这个 operation 就结束了。这种方式使用起来非常简单，但是灵活性相对重写 start 来说要少一些， 因为main方法执行完就认为operation结束了，所以一般可以用来执行同步任务。

``` objc
	@implementation YourOperation
    - (void)main
    {
        // 任务代码 ...
    }
	@end
```

如果你希望拥有更多的控制权，或者想在一个操作中可以执行异步任务，那么就重写 `start` 方法, 但是注意：这种情况下，你必须手动管理操作的状态， 只有当发送 `isFinished` 的 KVO 消息时，才认为是 operation 结束

``` objc
	@implementation YourOperation
    - (void)start
    {
    	self.isExecuting = YES;
        // 任务代码 ...
    }
    - (void)finish //异步回调
    {
    	self.isExecuting = NO;
    	self.isFinished = YES;
    }
	@end
```
** 当实现了start方法时，默认会执行start方法，而不执行main方法 **

为了让操作队列能够捕获到操作的改变，需要将状态的属性以配合 `KVO` 的方式进行实现。如果你不使用它们默认的 setter 来进行设置的话，你就需要在合适的时候发送合适的 `KVO` 消息。

需要手动管理的状态有：

* `isExecuting` 代表任务正在执行中
* `isFinished` 代表任务已经执行完成
* `isCancelled` 代表任务已经取消执行

手动的发送 `KVO` 消息， 通知状态更改如下 ：

``` objc
	[self willChangeValueForKey:@"isCancelled"];
	_isCancelled = YES;
	[self didChangeValueForKey:@"isCancelled"];
```

为了能使用操作队列所提供的取消功能，你需要在长时间操作中时不时地检查 `isCancelled` 属性, 比如在一个长的循环中:

``` objc
@implementation MyOperation

- (void)main
{    
    while (notDone && !self.isCancelled) {
        // 任务处理
    }
}
@end

```

## 3. RunLoop

在cocoa中讲到多线程，那么就不得不讲到RunLoop。 在ios/mac的编码中，我们似乎不需要过多关心代码是如何执行的，一切仿佛那么自然。比如我们知道当滑动手势时，tableView就会滚动，启动一个NSTimer之后，timer的方法就会定时执行， 但是为什么呢，其实是RunLoop在帮我们做这些事情：分发消息。

### 3.1 什么是RunLoop

你应该看过这样的伪代码解释ios的app中main函数做的事情：

``` objc
int main(int argc, char * argv[])
{
    while (true) {
    	[[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
    }
}
```
也应该看过这样的代码用来阻塞一个线程：

``` objc
while (!complete) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
}
```
或许你感觉到他们有些神奇，希望我的解释能让你明白一些.

我们先思考一个问题： 当我们打开一个IOS应用之后，什么也不做，这时候看起来是没有代码在执行的，为什么应用没有退出呢？

我们在写c的简单的只有一个main函数的程序时就知道，当main的代码执行完，没有事情可做的时候，程序就执行完毕退出了。而我们IOS的应用是如何做到在没有事情做的时候维持应用的运行的呢? 那就是RunLoop。

RunLoop的字面意思就是“运行回路”，听起来像是一个循环。实际它就是一个循环，它在循环监听着事件源，把消息分发给线程来执行。RunLoop并不是线程，也不是并发机制，但是它在线程中的作用至关重要，它提供了一种异步执行代码的机制。

### 3.2 事件源

![runloop](/images/NSRunLoop.gif)

由图中可以看出NSRunLoop只处理两种源：输入源、时间源。而输入源又可以分为：`NSPort`、自定义源、`performSelector:OnThread:delay:`, 下面简单介绍下这几种源：

#### 3.2.1 NSPort 基于端口的源

Cocoa和 Core Foundation 为使用端口相关的对象和函数创建的基于端口的源提供了内在支持。Cocoa中你从不需要直接创建输入源。你只需要简单的创建端口对象，并使用NSPort的方法将端口对象加入到run loop。端口对象会处理创建以及配置输入源。

NSPort一般分三种： `NSMessagePort`（基本废弃）、`NSMachPort`、 `NSSocketPort`。 系统中的`NSURLConnection`就是基于`NSSocketPort`进行通信的，所以当在后台线程中使用`NSURLConnection` 时，需要手动启动RunLoop, 因为后台线程中的RunLoop默认是没有启动的，后面会讲到。

#### 3.2.2 自定义输入源

在Core Foundation程序中，必须使用CFRunLoopSourceRef类型相关的函数来创建自定义输入源，接着使用回调函数来配置输入源。Core Fundation会在恰当的时候调用回调函数，处理输入事件以及清理源。常见的触摸、滚动事件等就是该类源，由系统内部实现。

一般我们不会使用该种源，第三种情况已经满足我们的需求

#### 3.2.3 performSelector:OnThread

Cocoa提供了可以在任一线程执行函数（perform selector）的输入源。和基于端口的源一样，perform selector请求会在目标线程上序列化，减缓许多在单个线程上容易引起的同步问题。而和基于端口的源不同的是，perform selector执行完后会自动清除出run loop。

此方法简单实用，使用也更广泛。

#### 3.2.4 定时源

定时源就是NSTimer了，定时源在预设的时间点同步地传递消息。因为Timer是基于RunLoop的，也就决定了它不是实时的。

### 3.3 RunLoop观察者

我们可以通过创建`CFRunLoopObserverRef`对象来检测RunLoop的工作状态，它可以检测RunLoop的以下几种事件：

* Run loop入口
* Run loop将要开始定时
* Run loop将要处理输入源
* Run loop将要休眠
* Run loop被唤醒但又在执行唤醒事件前
* Run loop终止

### 3.4 Run Loop Modes

RunLoop对于上述四种事件源的监视，可以通过设置模式来决定监视哪些源。 RunLoop只会处理与当前模式相关联的源，未与当前模式关联的源则处于暂停状态。

cocoa和Core Foundation预先定义了一些模式（Apple文档翻译）：

<table class="table_plain">
<tr>
  <th style="width:20%;">Mode</th>
  <th>Name</th>
  <th>Description</th>
</tr>
<tr>
  <td>Default</td>
  <td>NSDefaultRunLoopMode (Cocoa) kCFRunLoopDefaultMode (Core Foundation)</td>
  <td>缺省情况下，将包含所有操作，并且大多数情况下都会使用此模式</td>
</tr>
<tr>
  <td>Connection</td>
  <td>NSConnectionReplyMode (Cocoa)</td>
  <td>此模式用于处理NSConnection的回调事件</td>
</tr>
<tr>
  <td>Modal</td>
  <td>NSModalPanelRunLoopMode (Cocoa)</td>
  <td>模态模式，此模式下，RunLoop只对处理模态相关事件</td>
</tr>
<tr>
  <td>Event Tracking</td>
  <td>NSEventTrackingRunLoopMode (Cocoa)</td>
  <td>此模式下用于处理窗口事件,鼠标事件等</td>
</tr>
<tr>
  <td>Common Modes</td>
  <td>NSRunLoopCommonModes (Cocoa) 
kCFRunLoopCommonModes (Core Foundation)</td>
  <td>此模式用于配置"组模式"，一个输入源与此模式关联，则输入源与组中的所有模式相关联。</td>
</tr>
</table>

我们也可以自定义模式，可以参考`ASIHttpRequest`在同步执行时，自定义了 runLoop 的模式叫 `ASIHTTPRequestRunLoopMode`。ASI的Timer源就关联了此模式。

### 3.5 常见问题一：为什么TableView滑动时，Timer暂停了？

我们做个测试： 在一个 viewController 的 `scrollViewWillBeginDecelerating:` 方法里面打个断点， 然后滑动 `tableView`。 待断点处， 使用 `lldb` 打印一下 `[NSRunLoop currentRunLoop]` 。 在描述中可以看到当前的RunLoop的运行模式：

	current mode = UITrackingRunLoopMode
	common modes = <CFBasicHash 0x14656e60 [0x3944dae0]>{type = mutable set, count = 2,
	entries =>
	0 : <CFString 0x398d54c0 [0x3944dae0]>{contents = "UITrackingRunLoopMode"}
	1 : <CFString 0x39449d10 [0x3944dae0]>{contents = "kCFRunLoopDefaultMode"}
	}

也就是说，当前主线程的 RunLoop 正在以 `UITrackingRunLoopMode` 的模式运行。  这个时候 RunLoop 只会处理与 `UITrackingRunLoopMode` “绑定”的源， 比如触摸、滚动等事件；而 `NSTimer` 是默认“绑定”到 `NSRunLoopDefaultMode` 上的， 所以 `Timer` 是事情是不会被 RunLoop 处理的，我们的看到的时定时器被暂停了！

常见的解决方案是把Timer“绑定”到 `NSRunLoopCommonModes` 模式上， 那么Timer就可以与：

``` objc
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];
```

这样这个Timer就可以和当前组中的两种模式 `UITrackingRunLoopMode` 和 `kCFRunLoopDefaultMode` 相关联了。 RunLoop在这两种模式下，Timer都可以正常运行了。

注意：
由上面可以发现 `NSTimer` 是不准确的。 因为RunLoop只负责分发源的消息。如果线程当前正在处理繁重的任务，比如循环，就有可能导致Timer本次延时，或者少执行一次。网上有人做过实验：

![runloop_timer](/images/runloop_timer.jpeg)

上面的Log是一个间隔为 `1 s` 的计时器，我们可以发现在 `12.836s ~ 15.835s` 之间的时间段内， 明显的 `13s` 的方法没有执行。 `14s` 的方法有所延迟。

因此当我们用NSTimer来完成一些计时任务时，如果需要比较精确的话，最好还是要比较“时间戳”。

### 3.6 常见问题二：后台的NSURLConnection不回调，Timer不运行

我们知道每个线程都有它的RunLoop, 我们可以通过 `[NSRunLoop currentRunLoop]` 或 `CFRunLoopGetCurrent()` 来获取。 但是主线程和后台线程是不一样的。主线程的RunLoop是一直在启动的。而后台线程的RunLoop是默认没有启动的。

后台线程的RunLoop没有启动的情况下的现象就是：“代码执行完，线程就结束被回收了”。就像我们简单的程序执行完就退出了。 所以如果我们希望在代码执行完成后还要保留线程等待一些异步的事件时，比如NSURLConnection和NSTimer， 就需要手动启动后台线程的RunLoop。

启动RunLoop，我们需要设定RunLoop的模式，我们可以设置 `NSDefaultRunLoopMode`。 那默认就是监听所有时间源：

``` objc
//Cocoa
[[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
	
//Core Foundation
CFRunLoopRun();
```
	
我们也可以设置其他模式运行, 甚至自定义运行Mode，但是我们就需要把“事件源” “绑定”到该模式上：

``` objc

extern NSString *kMyCustomRunLoopMode;
//NSURLConnection	
[_connection scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:kMyCustomRunLoopMode];
[[NSRunLoop currentRunLoop] runMode:kMyCustomRunLoopMode beforeDate:[NSDate distantFuture]];
    
//Timer
[[NSRunLoop currentRunLoop] addTimer:_timer forMode:kMyCustomRunLoopMode];
[[NSRunLoop currentRunLoop] runMode:kMyCustomRunLoopMode beforeDate:[NSDate distantFuture]];
	
```

### 3.7 NSCommonRunLoopModes

>  这一节是2016-3-24补充

因为以前的3.6的代码有个错误，而且对于`NSRunLoopCommonModes`没有详细说明，造成有同学对这块产生困惑, 因此有必要再开一节补充下关于`NSRunLoopCommonModes`的概念。

`NSRunLoopCommonModes` 并不是一个真正的runLoopMode, 也就是说这样的写法是错误的：
```
[[NSRunLoop currentRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate distantFuture]]; //wrong
```
这个写法并不会让runLoop运行。

下面解释下什么是CommonModes。

```c
struct __CFRunLoop {
    CFMutableSetRef _commonModes;     // 有哪些Mode被标记为Common
    CFMutableSetRef _commonModeItems; // 这里面就是RunLoop的源，observer,Timer等
    CFRunLoopModeRef _currentMode;    // 当前运行的Mode
    ...
};
```

上面大概是`CFRunLoop`中有关CommonMode的结构。这里面2个概念解释一下：

*  在RunLoop里可以用`CFRunLoopAddCommonMode`将一个Mode标记为`Common`属性，那么这个Mode就会存在`_commonModes`里面。主线程默认的`kCFRunLoopDefaultMode` 和 `UITrackingRunLoopMode` 都已经是`CommonModes`了，不需要再标记。

* `_commonModeItems`里面存放的源, observer, timer等，在每次runLoop运行的时候都会被同步到具有`Common`标记的Modes里。因此只要`_currentMode`是一个`Common`的Mode, 那么`_commonModeItems`里面的源,observer,timer也会执行。

因此这样addTimer时，timer也会执行的, 因为timer被添加到了`_commonModeItems`里面。
```objc
[[NSRunLoop currentRunLoop] addTimer:_timer forMode:NSRunLoopCommonModes];
[[NSRunLoop currentRunLoop] runMode:NSRunLoopDefaultMode beforeDate:[NSDate distantFuture]];
```


### 3.8 问题三：本节开头的例子为何可以阻塞线程

``` objc
while (!complete) {
	[[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
}
```

你应该知道这样一段代码可以阻塞当前线程，你可能会奇怪：RunLoop就是不停循环来检测源的事件，为什么还要加个 `while` 呢？

这是因为RunLoop的特性，RunLoop会在没有“事件源”可监听时休眠。也就是说如果当前没有合适的“源”被RunLoop监听，那么这步就跳过了，不能起到阻塞线程的作用，所以还是要加个while循环来维持。

同时注意：因为这段代码可以阻塞线程，所以请不要在主线程写下这段代码，因为它很可能会导致界面卡住。

## 4. 线程安全

讲了这么多，你是否已经对并发编程已经跃跃欲试了呢？ 但是并发编程一直都不是一个轻松的事情，使用并发编程会带来许多陷阱。哪怕你是一个很成熟的程序员和架构师，也很难避免线程安全的问题；使用的越多，出错的可能就越大，因此可以不用多线程就不要使用。

关于并发编程的不可预见性有一个非常有名的例子：在1995年， NASA (美国宇航局)发送了开拓者号火星探测器，但是当探测器成功着陆在我们红色的邻居星球后不久，任务嘎然而止，火星探测器莫名其妙的不停重启，在计算机领域内，遇到的这种现象被定为为优先级反转，也就是说低优先级的线程一直阻塞着高优先级的线程。在这里我们想说明的是，即使拥有丰富的资源和大量优秀工程师的智慧，并发也还是会在不少情况下反咬你你一口。

### 4.1 资源共享和资源饥饿

并发编程中许多问题的根源就是在多线程中访问共享资源。资源可以是一个属性、一个对象，通用的内存、网络设备或者一个文件等等。在多线程中任何一个共享的资源都可能是一个潜在的冲突点，你必须精心设计以防止这种冲突的发生。

一般我们通过锁来解决资源共享的问题，也就是可以通过对资源加锁保证同时只有一个线程访问资源

#### 4.1.1 互斥锁

互斥访问的意思就是同一时刻，只允许一个线程访问某个特定资源。为了保证这一点，每个希望访问共享资源的线程，首先需要获得一个共享资源的互斥锁。 对资源加锁会引发一定的性能代价。

#### 4.1.2 原子性

从语言层面来说，在 Objective-C 中将属性以 atomic 的形式来声明，就能支持互斥锁了。事实上在默认情况下，属性就是 atomic 的。将一个属性声明为 atomic 表示每次访问该属性都会进行隐式的加锁和解锁操作。虽然最把稳的做法就是将所有的属性都声明为 atomic，但是加解锁这也会付出一定的代价。

#### 4.1.3 死锁

互斥锁解决了竞态条件的问题，但很不幸同时这也引入了一些其他问题，其中一个就是死锁。当多个线程在相互等待着对方的结束时，就会发生死锁，这时程序可能会被卡住。

比如下面的代码：

``` objc
dispatch_sync(_queue, ^{
	dispatch_sync(_queue, ^{
		//do something
	});
})
```

再比如：

``` objc
main() {
dispatch_sync(dispatch_get_main_queue(), ^{
	//do something
});
}
```
上面两个例子也可以说明 `dispatch_sync` 这个API是危险的，所以尽量不要用。

**当你的代码有死锁的可能时，它就会发生**

#### 4.1.4 资源饥饿

当你认为已经足够了解并发编程面临的问题时，又出现了一个新的问题。锁定的共享资源会引起读写问题。大多数情况下，限制资源一次只能有一个线程进行读取访问其实是非常浪费的。因此，在资源上没有写入锁的时候，持有一个读取锁是被允许的。这种情况下，如果一个持有读取锁的线程在等待获取写入锁的时候，其他希望读取资源的线程则因为无法获得这个读取锁而导致资源饥饿的发生。

### 4.2 优先级反转

优先级反转是指程序在运行时低优先级的任务阻塞了高优先级的任务，有效的反转了任务的优先级。GCD提供了3种级别的优先级队列，分别是Default, High, Low。 高优先级和低优先级的任务之间共享资源时，就可能发生优先级反转。当低优先级的任务获得了共享资源的锁时，该任务应该迅速完成，并释放掉锁，这样高优先级的任务就可以在没有明显延时的情况下继续执行。然而高优先级任务会在低优先级的任务持有锁的期间被阻塞。如果这时候有一个中优先级的任务(该任务不需要那个共享资源)，那么它就有可能会抢占低优先级任务而被执行，因为此时高优先级任务是被阻塞的，所以中优先级任务是目前所有可运行任务中优先级最高的。此时，中优先级任务就会阻塞着低优先级任务，导致低优先级任务不能释放掉锁，这也就会引起高优先级任务一直在等待锁的释放。如下图：

![](/images/priority-inversion.png)

使用不同优先级的多个队列听起来虽然不错，但毕竟是纸上谈兵。它将让本来就复杂的并行编程变得更加复杂和不可预见。因此我们写代码的时候最好只用Default优先级的队列，不要使用其他队列来让问题复杂化。

关于dispatch_queue的底层线程安全设计可参考：[底层并发 API](http://webfrogs.me/2013/07/18/low-level_concurrency_apis/)

## 5. 总结

本文主要讲了 NSOperationQueue、 NSRunLoop、 和线程安全等三大块内容。 希望可以帮助你理解 NSOperation的使用， NSRunLoop的作用， 还有并发编程带来的复杂性和相关问题。

并发实际上是一个非常棒的工具。它充分利用了现代多核 CPU 的强大计算能力。但是因为它的复杂性，所以我们尽量使用高级的API，尽量写简单的代码，让并发模型保持简单； 这样可以写出高效、结构清晰、且安全的代码。

## 参考和引文

[1、https://objccn.io/issue-2-1/](https://objccn.io/issue-2-1/)
