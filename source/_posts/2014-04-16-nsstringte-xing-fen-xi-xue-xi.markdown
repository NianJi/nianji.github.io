---
layout: post
title: "NSString特性分析学习"
date: 2014-04-16 17:26:47 +0800
comments: true
categories: NSString Foundation __NSCFConstantString
---

我们都知道`NSString`是一个Objective-C的类，但是我们有时发现它的对象在内存管理上貌似和其他的对象有一些区别。比如有时你会发现对一个`NSString`进行`copy`操作时，它还是原本的对象，实际上并未拷贝对象。本博客就来研究下这个问题。

<!-- more -->

##1.NSString内存管理特性分析

###1.1 准备
为了方便测试，我先写了个宏，用来打印NSString的isa、内存地址、值、retainCount。
*注：为了了解内存特性，后面的代码都使用了手动内存管理。*

	#define TLog(_var) ({ NSString *name = @#_var; NSLog(@"%@: %@ -> %p : %@  %d", name, [_var class], _var, _var, (int)[_var retainCount]); })
	
###1.2 NSString的创建

####1.2.1测试NSString
在objc中，我们一般通过几种方法来创建NSString呢，一般有三种方法，现在我们就分别对这三种情况写段测试代码，如下：

``` objc
NSString *str1 = @"1234567890";    TLog(str1);
//str1: __NSCFConstantString -> 0x715ec : 1234567890  -1

NSString *str2 = [NSString stringWithString:@"1234567890"];        TLog(str2);
//str2: __NSCFConstantString -> 0x715ec : 1234567890  -1

NSString *str3 = [NSString stringWithFormat:@"1234567890"];        TLog(str3);
//str3: __NSCFString -> 0x1557cb50 : 1234567890  1
```
看到上面这段测试代码，我们可以发现几点同我们想象不同的地方：

* 第一种方式和第二种方式创建出来的NSString时一模一样的，isa是__NSCFConstantString，内存地址一样，retainCount是-1.
* 第三种方式创建的NSString和创建其他objc对象类似的，在堆上分配内存，初始retainCount为1.

这里面有几个疑问：

* 什么是__NSCFConstantString？
* 为什么第一种和第二种NSString的内存地址是一样的？
* 为什么他们的retainCount是-1？

####1.2.2 NSString创建的写法

其实上面第一种写法和第二种写法是完全一样的，没有任何区别，从iosSDK6开始，第二种写法已经被遗弃了，如果用第二种写法创建NSString,编译器就会报一个警告。

####1.2.3 retainCount为-1是什么情况

首先retainCount是NSUInteger的类型，其实上面的打印是将它作为int类型打印。所以它其实不是-1，它的实际值是4294967295。

在objc的retainCount中.如果对象的retainCount为这个值，就意味着“无限的retainCount”，这个对象是不能被释放的。

所有的 \_\_NSCFConstantString对象的retainCount都为-1，这就意味着 \_\_NSCFConstantString不会被释放，使用第一种方法创建的NSString，如果值一样，无论写多少遍，都是同一个对象。而且这种对象可以直接用 `==` 来比较

``` objc
NSString *str1 = @"1234567890";    TLog(str1);
//str1: __NSCFConstantString -> 0x715ec : 1234567890  -1

NSString *str2 = @"1234567890";    TLog(str2);
//str2: __NSCFConstantString -> 0x715ec : 1234567890  -1

assert(@"abc"==@"abc"); //一直正确
```

###1.3 NSString的retain、copy和mutableCopy

我们写一段代码分别对 \_\_NSCFConstantString 和 \_\_NSCFString 进行retain和copy测试

``` objc __NSCFConstantString
	NSString *str1 = @"a";    TLog(str1);
    NSString *str2 = [str1 retain];  TLog(str2);
    NSString *str3 = [str1 copy]; TLog(str3);
    NSString *str4 = [str1 mutableCopy]; TLog(str4);
    
    /*
    	str1: __NSCFConstantString -> 0x7c5e0 : a  -1
    	str2: __NSCFConstantString -> 0x7c5e0 : a  -1
    	str3: __NSCFConstantString -> 0x7c5e0 : a  -1
    	str4: __NSCFString -> 0x1559eb80 : a  1
    */
```
上面的测试可以看出，对一个\_\_NSCFConstantString进行retain和copy操作都还是自己，没有任何变化，对其mutableCopy操作可将其拷贝到堆上，retainCount为1.

``` objc __NSCFString
	NSString *str1 = [@"a" mutableCopy];    TLog(str1);
    NSString *str2 = [str1 retain];  TLog(str2);
    NSString *str3 = [str1 copy]; TLog(str3);
    NSString *str4 = [str1 mutableCopy]; TLog(str4);
    
    /*
    	str1: __NSCFString -> 0x17d6d280 : a  1
    	str2: __NSCFString -> 0x17d6d280 : a  2
    	str3: __NSCFConstantString -> 0x3bd40090 : a  -1
    	str4: __NSCFString -> 0x17e684d0 : a  1
    */
```
上面的测试中，我们发现，对\_\_NSCFString进行retain和mutableCopy操作时，其特性符合正常的对象特性。但是对其copy时，它却变成了一个\_\_NSCFConstantString对象！为了确定什么情况下才会出现这种现象我们多做一些测试

``` objc
NSString *str1 = [[@"a" mutableCopy] copy];    TLog(str1);
NSString *str2 = [NSString stringWithFormat:@"%s","a"];  TLog(str2);
NSString *str3 = [[[@"path/a" lastPathComponent] mutableCopy] copy]; TLog(str3);
        
NSString *str4 = [[@"b" mutableCopy] copy]; TLog(str4);
NSString *str5 = [[@"c" mutableCopy] copy]; TLog(str5);
NSString *str6 = [[@"d" mutableCopy] copy]; TLog(str6);
NSString *str7 = [[@"e" mutableCopy] copy]; TLog(str7);
NSString *str8 = [[@"f" mutableCopy] copy]; TLog(str8);

NSString *str9 = [[@"\\" mutableCopy] copy]; TLog(str9);
NSString *str10 = [[@"$" mutableCopy] copy]; TLog(str10);
NSString *str11 = [[@"." mutableCopy] copy]; TLog(str11);
NSString *str12 = [[@"aa" mutableCopy] copy]; TLog(str12);
/*
str1: __NSCFConstantString -> 0x3bd40090 : a  -1
str2: __NSCFConstantString -> 0x3bd40090 : a  -1
str3: __NSCFConstantString -> 0x3bd40090 : a  -1
str4: __NSCFString -> 0x175ab390 : b  1
str5: __NSCFString -> 0x176a5ce0 : c  1
str6: __NSCFString -> 0x175ab960 : d  1
str7: __NSCFString -> 0x176a5cc0 : e  1
str8: __NSCFString -> 0x176a5d50 : f  1
str9: __NSCFString -> 0x176a5d60 : \  1
str10: __NSCFString -> 0x176a6700 : $  1
str11: __NSCFString -> 0x175ab750 : .  1
str12: __NSCFString -> 0x175ab760 : aa  1
*/
```
起初我以为是ASCII字符比较特殊，经过上面这一段的测试发现，只有@"a"才有这样的现象，我又用模拟器测试了这一段代码，结果得到的都是__NSCFString的对象。这个问题研究了一会，没找到答案，暂时就放下了，好在这个对于我们编码没什么影响。
<p style="color:#ff0000">问题遗留</p>

##2. 小结

经过这一系列的测试分析，让我们认识了__NSCFConstantString以及它的一些特性，它是在编译时就决定的，不能在运行时创建。