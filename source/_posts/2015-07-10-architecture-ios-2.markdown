---
layout: post
title: "IOS应用架构思考二（网络图片库）"
date: 2015-07-10 14:35:27 +0800
comments: true
categories: 能工巧匠集
---

移动端架构中图片库是非常重要的一环，其实图片库也可以理解为网络库的一种特殊使用模式，为了满足需要，图片库至少要满足以下特点：

* 提供一个加载入口，通常以UIImageView的类别方法`setImageWithURL:...`开始
* 支持异步网络加载图片
* 支持内存缓存和文件缓存
* 确保同一张图片不会被重复下载
* 主流图片格式的解码

<!-- more -->

著名的优秀关于图片加载的库有：

* [SDWebImage](https://github.com/rs/SDWebImage)

* [AFNetworking](https://github.com/AFNetworking/AFNetworking)

* [EGOImageLoading](https://github.com/enormego/EGOImageLoading) 已经年久失修

### 1. Load入口

关于Load入口方式，一般有两种方式，[SDWebImage](https://github.com/rs/SDWebImage) 中的Category 方式，
和[EGOImageLoading](https://github.com/enormego/EGOImageLoading)中的继承模式。不过EGOImageLoading已经年久失修，
早就不流行了，SDWebImage的方式更流行，Category的方式也显得更好，因为不需要对业务代码做太多侵入。
所以Extension的方式貌似无可争议。

### 2. 图片的下载

首先你要设计一个全局的队列来执行下载任务，因为我们要保证下载任务不重复，那么就需要一个任务管理器来统一调度下载任务，比如有2个UIImageView同时加载同一张图片，那么就只执行一次下载，下载完成回调给2个View就行了。

回调的方式 `SDWebImage` 采用`block`的方式，`EGOImageLoading`采用了`Notification`的方式, 因为可能存在多个回调，
所以不太适合用delegate的方式进行回调，不过如果非要想用也可以，可以创建一个weak引用的`CFArrayRef` 或者用 `NSHashTable` 来把保存 delegate 指针。

`SDWebImageDownloaderOperation` 作为 SDWebImage 的网络Operation的设计，如果有同学研究过源码可以发现，`SDWebImageDownloaderOperation` 
里面维持了线程的存在（通过启用RunLoop）， 这个设计貌似和我上篇文章[IOS应用架构思考一（网络层）](http://blog.cnbluebox.com/blog/2015/05/07/architecture-ios-1/)
中说的不太一致。SDWebImage 之所以这样设计是有意义的，就是图片数据解码的工作，特别是当Option设置为`SDWebImageDownloaderProgressiveDownload` 时，
每接收到一点data都要解码出一个图片, 这些解码的工作就可以继续在这个线程里面执行了，当然我觉得也不一定非要如此设计，
`dispatch_quque`本来对于线程的管理就有一套了，只要保证图片解码在后台执行就行了，比如AFNetworking中也做到了图片解码放在后台。这一点的设计其实没有AFNetworking好

### 3. 缓存

#### 3.1 缓存方式选择

说到缓存，我们知道在IOS5之后，NSURLCache 也有diskCache了，是不是我们不需要自己实现cache机制了，直接使用NSURLCache就好了呢？
分析这个必要性，我们首先要思考NSURLCache中保存的是什么，NSURLCache中保存的是Http协议返回的rawData, 没有经过解压和解码的过程，
如果直接使用NSURLCache, 那么每次读缓存的时候就还需要把rawData解码为我们需要的UIImage，这肯定会带来额外的CPU开销。那如果我们
自己来做缓存，我们可以将解码后的数据保存到disk，就可以减少我们读缓存的时间了。这一点也是我觉得SDWebImage唯一比AFNetworking好
的一个亮点了，其他的AFNetworking也都做到了，（AFNetworking直接使用NSURLCache做diskCache, 在后台线程解码image)

#### 3.2 内存缓存

关于缓存，我们还需要设计内存缓存，diskCache 在读取的时候还是要消耗I/O的时间，可能带来对FPS的影响和电量的消耗，
那么我们设计内存缓存在一定程度上可以缓解这个问题，对于频繁使用的图片，效果会更好。PS: 内存缓存需要做好内存控制，不能让其过多
的占用内存，比如内存警告时要清空。 NSURLCache 虽然也有内存缓存，但是不太可控，所以内存缓存还是自己实现比较合适。

#### 3.3 缓存时间

缓存时间的设定其实比较重要，其实有时候缓存时间的设置，使用NSURLCache的话，缓存时间可以是由图片服务器来决定的，客户端不用太操心什么，
这个是用NSURLCache的好处，那么如果我们自己实现的缓存方式呢，SDWebImage里面是可以统一设置缓存的时间，默认是一周的时间，其实这个设定
我是觉得不太合理的，因为不同的业务场景很可能会要求不同的缓存时间设定，怎么能够大一统的设置了事，不过好在现在的一般应用场景没有对缓存
时间硬性的要求，所以用起来也没什么问题。

话说我以前在苏宁易购的时候，就对EGOImageLoading做过大修改，添加了很多SDWebImage的优点特性，关于缓存时间也做了个性化设定。但其实NSURLCache
的方式才是决定缓存寿命的最好的方式。

### 4. 图片解码

作为一个图片库，支持主流图片格式的解码那是必须的，像png, jpg, gif这些肯定是要支持的，现在很火的webp也是需要考虑支持的，webp对网络流量和速度
的提升意义是很大的。Google已经开源了[libwebp](https://chromium.googlesource.com/webm/libwebp), 而且SDWebImage现在也已经支持了WebP格式的解码
可以参考SDWebImage的使用将WebP的功能集成进去。

### 5. 其他

#### 5.1 渐进加载

图片渐进加载可能也是产品体验上锦上添花的一个点了，图片渐进加载要取决于JPEG图片的保存格式了，主要有两种Baseline JPEG和Progressive JPEG, 在渐进
加载的过程中Baseline JPEG就会一行一行的展示，而Progressive JPEG就可以从模糊到清晰的方式，毫无疑问Progressive JPEG的方式是可以提升用户体验的方式，
图片的格式正确后，SDWebImage中只需要将option设置为`SDWebImageDownloaderProgressiveDownload` 时，就可以实现图片渐进显示了，其实也就是使用了ImageIO
来解析：[progressive-images-download-imageio](http://www.cocoaintheshell.com/2011/05/progressive-images-download-imageio/)

#### 5.2 图片裁剪

有时候可能会有一些图片裁剪的需求，比如说placeholder随着view大小自适应，或者一张源图片可能会裁剪为不同尺寸来展示，那么这个时候可能会做一些裁剪的
操作，裁剪操作可能需要做到2点，不要在主线程做，不要重复裁剪相同尺寸。

#### 5.3 FastImageCache

[FastImageCache](https://github.com/path/FastImageCache.git) 是Path开源的关于图片缓存的库，它不是一个网络库，只是一个图片缓存库，实现了disk内存映射
对FPS提升很有帮助，一般应用不太需要使用，但是对于图片类应用绝对是优化利器，[iOS图片加载速度极限优化—FastImageCache解析](http://blog.cnbang.net/tech/2578/)
这篇文章对于FastImageCache的讲解非常详细。

暂时也写到这吧，以后有补充再写，欢迎勘误。


