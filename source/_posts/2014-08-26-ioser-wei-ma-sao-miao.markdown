---
layout: post
title: "IOS二维码扫描,你需要注意的两件事"
date: 2014-08-26 09:16:00 +0800
comments: true
categories: cropRect rectOfInterest 二维码扫描 sessionPreset
---

在 IOS7 以前，在IOS中实现二维码和条形码扫描，我们所知的有，两大开源组件 `ZBar` 与 `ZXing`. 这两大组件我们都有用过，这里总结下各自的缺点：

* `ZBar`

`ZBar`在扫描的灵敏度上，和内存的使用上相对于`ZXing`上都是较优的，但是对于 “圆角二维码” 的扫描确很困难。如：

![](/images/qrcode_roundcorner.png)

* `ZXing`

ZXing 是 Google Code上的一个开源的条形码扫描库，是用java设计的，连Google Glass 都在使用的。但有人为了追求更高效率以及可移植性，出现了c++ port. Github上的Objectivc-C port，其实就是用OC代码封装了一下而已，而且已经停止维护。这样效率非常低，在instrument下面可以看到CPU和内存疯涨，在内存小的机器上很容易崩溃

* `AVFoundation`

AVFoundation无论在扫描灵敏度和性能上来说都是最优的，所以毫无疑问我们应该切换到`AVFoundation`，需要兼容IOS6或之前的版本可以用zbar或zxing代替。

下面介绍本文的重点，无论你是用以上哪一种或其他的解决方案，都需要知道下面两点。

<!-- more -->

## 1. 图片很小的二维码

以前测试提了一个bug，说有二维码扫不了，拿到二维码一看，是个很小的二维码,边长不到1cm，于是就修改了 `sessionPreset` 为 1080p 的，当时用的是ZXing, 当把图片质量改清楚时，也造成了性能的下降，基本打开扫描界面就会报memoryWarning，但是也确实解决了小二维码扫描的问题。

`AVCaptureSession` 可以设置 `sessionPreset` 属性，这个决定了视频输入每一帧图像质量的大小。

* AVCaptureSessionPreset320x240
* AVCaptureSessionPreset352x288
* AVCaptureSessionPreset640x480
* AVCaptureSessionPreset960x540
* AVCaptureSessionPreset1280x720
* AVCaptureSessionPreset1920x1080

以上列举了部分的属性值，分别代表输入图片质量大小，一般来说`AVCaptureSessionPreset640x480`就够使用，但是如果要保证较小的二维码图片能快速扫描，最好设置高些，如`AVCaptureSessionPreset1920x1080`(就是我们常说的1080p).

## 2. scanCrop

另一个提升扫描速度和性能的就是设置解析的范围，在zbar和zxing中就是`scanCrop`, `AVFoundation`中设置 `AVCaptureMetadataOutput` 的 `rectOfInterest` 属性来配置解析范围。

最开始我按照文档说的按照比例值来设置这个属性，如下:

``` objc
	CGSize size = self.view.bounds.size;
	CGRect cropRect = CGRectMake(40, 100, 240, 240);
	captureOutput.rectOfInterest = CGRectMake(cropRect.origin.x/size.width,
											   cropRect.origin.y/size.height, 
											   cropRect.size.width/size.width,
											   cropRect.size.height/size.height);
```

但是发现， Oops， 好像不对啊，扫不到了，明显不正确呢，于是**猜想**： AVCapture输出的图片大小都是横着的，而iPhone的屏幕是竖着的，那么我把它旋转90°呢：

``` objc
	CGSize size = self.view.bounds.size;
	CGRect cropRect = CGRectMake(40, 100, 240, 240);
	captureOutput.rectOfInterest = CGRectMake(cropRect.origin.y/size.height,
											   cropRect.origin.x/size.width, 
											   cropRect.size.height/size.height,
											   cropRect.size.width/size.width);
```
OK，貌似对了，在iPhone5上一切工作良好，但是在4s上，或者换了`sessionPreset`的大小之后，这个框貌似就不那么准确了， 可能发现超出框上下一些也是可以扫描出来的。 再次猜想： 图片的长宽比和手机屏幕不是一样的，这个`rectOfInterest`是相对于图片大小的比例。比如iPhone4s屏幕大小是 640x960, 而图片输出大小是 1920x1080. 实际的情况可能就是下图中的效果:

![](/images/scan_1.png)  

上图中下面的代表iPhone4s屏幕,大小640x960, 上面代表`AVCaptureVideoPreviewLayer`中预览到的图片位置，在图片输入为1920x1080大小时，实际大小上下会被截取一点的，因为我们`AVCaptureVideoPreviewLayer`设置的`videoGravity`是`AVLayerVideoGravityResizeAspectFill`, 类似于`UIView`的`UIViewContentModeScaleAspectFill`效果。

于是我对大小做了一下修正：

``` objc
	CGSize size = self.view.bounds.size;
	CGRect cropRect = CGRectMake(40, 100, 240, 240);
	CGFloat p1 = size.height/size.width;
	CGFloat p2 = 1920./1080.;  //使用了1080p的图像输出
	if (p1 < p2) {
		CGFloat fixHeight = bounds.size.width * 1920. / 1080.;
		CGFloat fixPadding = (fixHeight - size.height)/2;
		captureOutput.rectOfInterest = CGRectMake((cropRect.origin.y + fixPadding)/fixHeight,
                                                  cropRect.origin.x/size.width,
                                                  cropRect.size.height/fixHeight,
                                                  cropRect.size.width/size.width);
    } else {
        CGFloat fixWidth = bounds.size.height * 1080. / 1920.;
        CGFloat fixPadding = (fixWidth - size.width)/2;
        captureOutput.rectOfInterest = CGRectMake(cropRect.origin.y/size.height,
                                                  (cropRect.origin.x + fixPadding)/fixWidth,
                                                  cropRect.size.height/size.height,
                                                  cropRect.size.width/fixWidth);
    }
```
经过上面的验证，证实了猜想`rectOfInterest`是基于图像的大小裁剪的。

## 3. 小结

scanCrop对于扫描来说是比较重要的，试想图片截小点来解析是不是理论上就会更快了呢。网络上貌似很难搜到关于scanCrop的详解，希望对看到的人有帮助。


