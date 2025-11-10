---
layout: post
title: "dyld与ObjC"
date: 2017-06-20 12:52:26 +0800
comments: true
categories: dyld
---

dyld 是ios上的二进制加载器，如何剖析这个过程呢？

<!-- more -->

## 0x10 dyld

dyld是加载mach-o的库。 一切都从 `_dyld_start` 开始,  拉到源码看下，这是个汇编方法（arm64）：

![screenshot.png](/images/dyld1/1.png)

找到 `dyldbootstrap::start` 这个方法，看到最后调用到了 `dyld::_main` 这个方法。
`dyld:_main`的源码较长, 里面就整个加载过程，有兴趣同学可以下载dyld来看，过程大概如下：

> 
   1. `设置运行环境，环境变量` 
   2.  `实例化Image`
   3.  `加载共享缓存` 
   4. `动态库的版本化重载`
   5. `加载插入的动态库`
   6.  `link主程序`
   7.  `link插入的动态库` 
   8.  `weakBind`  
   9.  `initialize` 
   10.  `main`

本文会对其中几步进行描述：
### 0x11 实例化可执行文件

 在 `dyld::_main`中找到了 `instantiateFromLoadedImage`，这个方法就是实例化的过程。

``` 
static ImageLoader* instantiateFromLoadedImage(const macho_header* mh, uintptr_t slide, const char* path)
{
	// try mach-o loader
	if ( isCompatibleMachO((const uint8_t*)mh, path) ) {
		ImageLoader* image = ImageLoaderMachO::instantiateMainExecutable(mh, slide, path, gLinkContext);
		addImage(image);
		return image;
	}
	
	throw "main executable not a known format";
}
```
从这个方法中，我们大致可以看到加载有三步：

>  `isCompatibleMachO`  => `instantiateMainExecutable`  => `addImage`

字面意思已经挺明确了：
*  `isCompatibleMachO` 是检查mach-o的subtype是否是当前cpu可以支持； 
* `instantiateMainExecutable` 就是实例化可执行文件， 这个期间会解析LoadCommand， 这个之后会发送 dyld_image_state_mapped 通知； 
* `addImage` 添加到 allImages中。

### 0x12 link过程都做了什么
实例化之后就是动态链接的过程
link 这个过程就是将加载进来的二进制变为可用状态的过程。简单来说就是：

>  `rebase` => `binding`

这些过程的信息都存储在`LoadCommand`的 `LC_DYLD_INFO` 这个cmd中。解析出来会得到这样的信息：
```
struct dyld_info_command {
   uint32_t   cmd;		/* LC_DYLD_INFO or LC_DYLD_INFO_ONLY */
   uint32_t   cmdsize;		/* sizeof(struct dyld_info_command) */
   uint32_t   rebase_off;	/* file offset to rebase info  */
   uint32_t   rebase_size;	/* size of rebase info   */
   uint32_t   bind_off;	/* file offset to binding info   */
   uint32_t   bind_size;	/* size of binding info  */
   uint32_t   weak_bind_off;	/* file offset to weak binding info   */
   uint32_t   weak_bind_size;  /* size of weak binding info  */
   uint32_t   lazy_bind_off;	/* file offset to lazy binding info */
   uint32_t   lazy_bind_size;  /* size of lazy binding infs */
   uint32_t   export_off;	/* file offset to export info */
   uint32_t   export_size;	/* size of export infs */
};
```
这里面分别记录了哪些地址需要被 rebase, binding 等。


> 什么是`rebase`? 为什么要做rebase?  

`rebase`就是针对 “mach-o在加载到内存中不是固定的首地址” 这一现象做数据修正的过程。

> 什么是`binding`?

`binding`就是将这个二进制调用的外部符号进行绑定的过程。 比如我们objc代码中需要使用到`NSObject`, 即符号`_OBJC_CLASS_$_NSObject`，但是这个符号又不在我们的二进制中，在系统库 Foundation.framework中，因此就需要`binding`这个操作将对应关系绑定到一起。

> 什么是`lazyBinding`?

`lazyBinding`就是在加载动态库的时候不会立即binding, 当时当第一次调用这个方法的时候再实施binding。 做到的方法也很简单： 通过`dyld_stub_binder` 这个符号来做。 lazy binding的方法第一次会调用到`dyld_stub_binder`, 然后`dyld_stub_binder`负责找到真实的方法，并且将地址bind到桩上，下一次就不用再bind了。

> 什么是`weakBinding`?

weakBind 这个我也没有太搞懂什么时候会有weakBind的符号，应是在c++中的场景。oc没看到过。但是从代码中可以看出这一步会对所有含有弱符号的镜像合并排序进行bind.


篇幅有限，这块就讲这些。有兴趣的同学可以撸源码！

### 0x13  initialize

这一步就是执行`initialize`的方法的时候了。也就是c++ 中的 __attribute__((constructor)) 方法。编译在mach-o里面会有一个section记录了这些方法，如下：

![screenshot.png](/images/dyld1/2.png).

上图的步骤中我们也可以看到，这一步是在main函数之前的。

## 0x20 ObjC

上面都是在讲dyld, 那么是如何与ObjC关联起来的呢？ ObjC的运行时是什么时候启动的呢？ `+Load`方法是什么时候调用的呢？

### 0x21 objc的启动

翻一下objc的源码，发现了 `objc_init`这个方法, 实现看起来很简单，贴一下源码：

```
void _objc_init(void)
{
    static bool initialized = false;
    if (initialized) return;
    initialized = true;
    
    // 各种初始化
    environ_init();
    tls_init();
    static_init();
    lock_init();
    // 看了一下exception_init是空实现！！就是说objc的异常是完全采用c++那一套的。
    exception_init();
   // 注册dyld事件的监听
    _dyld_objc_notify_register(&map_2_images, load_images, unmap_image);
}
```
这个方法是什么时候调用的呢,断点一下：

![screenshot.png](/images/dyld1/3.png)

根据这张图，再结合dyld的知识，原来：

> objc_init是在 `libsystem` 中的一个initialize方法 `libsystem_initializer`中初始化了 libdispatch, 然后libdispatch调用了`_os_object_int`, 最终调用了 `_objc_init`.

如下：
```
_os_object_init(void)
{
	_objc_init();
	Block_callbacks_RR callbacks = {
		sizeof(Block_callbacks_RR),
		(void (*)(const void *))&objc_retain,
		(void (*)(const void *))&objc_release,
		(void (*)(const void *))&_os_objc_destructInstance
	};
	_Block_use_RR2(&callbacks);
#if DISPATCH_COCOA_COMPAT
	const char *v = getenv("OBJC_DEBUG_MISSING_POOLS");
	_os_object_debug_missing_pools = v && !strcmp(v, "YES");
#endif
}
```

`_dyld_objc_notify_register` 这个方法在苹果开源的dyld里面可以找到，然后看到调用了`dyld::registerObjCNotifiers`这个方法：

```
void registerObjCNotifiers(_dyld_objc_notify_mapped mapped, _dyld_objc_notify_init init, _dyld_objc_notify_unmapped unmapped)
{
	// record functions to call
	sNotifyObjCMapped	= mapped;
	sNotifyObjCInit		= init;
	sNotifyObjCUnmapped = unmapped;

	// call 'mapped' function with all images mapped so far
       // 第一次先触发一次ObjCMapped
	try {
		notifyBatchPartial(dyld_image_state_bound, true, NULL, false, true);
	}
	catch (const char* msg) {
		// ignore request to abort during registration
	}
}
```

从字面意思可以明白，传进来的分别是 map, init, unmap事件的回调。 dyld的事件通知有以下几种，分别会在特定的时机发送：
```
enum dyld_image_states
{
	dyld_image_state_mapped					= 10,		// No batch notification for this
	dyld_image_state_dependents_mapped		= 20,		// Only batch notification for this
	dyld_image_state_rebased				= 30, 
	dyld_image_state_bound					= 40,
	dyld_image_state_dependents_initialized	= 45,		// Only single notification for this
	dyld_image_state_initialized			= 50,
	dyld_image_state_terminated				= 60		// Only single notification for this
};
```

大家可能奇怪， 上面第一次触发mapped的为啥发送的是 bound 事件。因为此Mapped的非彼mapped. `ObjCMapped`实际上是在 `binding`结束之后执行的。

### 0x22 ObjC  map images

下面再来看看 `map_2_images`, 就是这个`ObjCMapped` 干了啥, 简单来说就是对这个二进制中的ObjC相关的信息进行初始化。关键信息可以看 `_read_images`:

* init classes map: 第一次调用时会初始化一个全局的一个Map: `gdb_objc_realized_classes` 用来存放class

* readClasses: 这一步会把class从二进制里面读出来， 然后将 `class_ro_t` 替换为 `class_rw_t`. class_ro会放在`class_rw_t`里面。然后把class加入到第一步创建的`gdb_objc_realized_classes`里面。

注意，这个时候，虽然放到了`gdb_objc_realized_classes` 但是class还没有realized, 后面会有realize的步骤
附图：
![image.png](/images/dyld1/4.png)

* fix selector: selector的唯一性
* read protocols: 读取protocol. 看读取protocol的源码可以发现： 
    * ① protocol is an objc_object!, 
    * ② protocol具有唯一性 
    * ③ protocol的isa都指向： OBJC_CLASS_$_Protocol
* realizeClasses:  这一步的意义就是动态链接好class, 让class处于可用状态，主要操作如下：
    * ① 检查ro是否已经替换为rw,没有就替换一下。
    * ② 检查类的父类和metaClass是否已经realize,没有就先把它们先realize
    * ③ 重新layout ivar. 因为只有加载好了所有父类，才能确定ivar layout
    * ④ 把一些flags从ro拷贝到rw
    * ⑤ 链接class的 nextSiblingClass 链表
    * ⑥ attach categories: 合并categories的method list、 properties、protocols到 class_rw_t 里面
 
* read categories: 读取categories，然后attach

### 0x23 ObjC load_images

`load_images`这一步很简单，就是调用`+Load`. 前面也看到了，这个方法是在监听`dyld_image_state_dependents_initialized` 这个事件的时候会执行。因此 `+Load`和 `constructor`的执行时机是差不多的。

DEBUG一下会发现`+Load`是在 `constructor`之前执行的，为什么呢？

```
 we are about to initialize this image
uint64_t t1 = mach_absolute_time();
fState = dyld_image_state_dependents_initialized;
oldState = fState;
// 当dependent的initializer执行完成之后，发送dyld_image_state_dependents_initialized事件，这个时候接收到事件就开着执行Load了
context.notifySingle(dyld_image_state_dependents_initialized, this, &timingInfo);

// 而constructor在这里。
bool hasInitializers = this->doInitialization(context);

// let anyone know we finished initializing this image
fState = dyld_image_state_initialized;
oldState = fState;
context.notifySingle(dyld_image_state_initialized, this, NULL);
```

因此 `+Load`是还要在`constructor`之前执行的哦，但也就是紧挨着执行的。

## 0x30 小结

看了dyld和objc的源码，感觉学到很多，本文主要讲了objc怎么run起来的。包括大概的流程，但是实际上还有很多细节没有详细讲， 比如ObjC的class在二进制中是什么样？加载到runtime又什么样，有兴趣的同学可以下载源码详细挖掘，推荐使用MachOView这个工具来看二进制的结构是怎么样的，对于理解加载很有帮助。


