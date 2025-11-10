---
layout: post
title: "IOS自动布局之Autoresizing"
date: 2014-09-09 09:52:52 +0800
comments: true
categories: ios自动布局 autoresizing
---
![](/images/iphone6.png)

对于IOS的app开发者来说，不会像Android开发者一样为很多的屏幕尺寸来做界面适配，因此硬编码的坐标也能工作良好，但是从设计模式上来说这不是好的做法。而且也还有一些问题，如iPhone5的适配，横竖屏的切换等。或许你可以做两套UI方案来做适配，但是这样增加重复工作量，而且不够高端，万一有出新的屏幕大小了呢。哲理就将介绍IOS中的两大自动布局利器：`Autoresizing` 和 `Autolayout`。 autoresizing是UIView的属性，一直都有，使用简单，但是没有autolayout强大。autolayout是IOS6以后的新技术，更加强大。本文主要介绍`Autoresizing`的特性和用法。

<!-- more -->

## 1. Autoresizing特性

当`UIView`的`autoresizesSubviews`是`YES`时，（默认是YES）, 那么在其中的子view会根据它自身的`autoresizingMask`属性来自动适应其与`superView`之间的位置和大小。

`autoresizingMask`是一个枚举类型, 默认是`UIViewAutoresizingNone`, 也就是不会autoresize：

``` objc
typedef NS_OPTIONS(NSUInteger, UIViewAutoresizing) {
    UIViewAutoresizingNone                 = 0,
    UIViewAutoresizingFlexibleLeftMargin   = 1 << 0,
    UIViewAutoresizingFlexibleWidth        = 1 << 1,
    UIViewAutoresizingFlexibleRightMargin  = 1 << 2,
    UIViewAutoresizingFlexibleTopMargin    = 1 << 3,
    UIViewAutoresizingFlexibleHeight       = 1 << 4,
    UIViewAutoresizingFlexibleBottomMargin = 1 << 5
};
```
这个枚举类型，使用了 `1 << n` 这样的写法来定义，代表了它可以复选。如果你不明白为什么，可以复习下“位运算”。 那么这些值分别代表什么意思呢？

其实如何理解这几个值很简单，那就是从xib里面看。
我们在一个xib文件中，取消勾选`autolayout`，(默认使用autolayout时，autoresizing看不到)。那么我们可以在布局那一栏看到如何设置`autoresizing`.

![](/images/autoresizing.png)

上图说明了在xib中设置的这些线条和实际属性对应的关系，这其中需要注意的是，其中4个margin虚线才代表设置了该值，而width和height是实线代表设置了该值，不能想当然的理解。

这些项分别代表：

* UIViewAutoresizingNone view的frame不会随superview的改变而改变
* UIViewAutoresizingFlexibleLeftMargin 自动调整view与superview左边的距离保证右边距离不变
* UIViewAutoresizingFlexibleWidth 自动调整view的宽，保证与superView的左右边距不变
* UIViewAutoresizingFlexibleRightMargin 自动调整view与superview右边的距离保证左边距不变
* UIViewAutoresizingFlexibleTopMargin 自动调整view与superview顶部的距离保证底部距离不变
* UIViewAutoresizingFlexibleHeight 自动调整view的高，保证与superView的顶部和底部距离不变
* UIViewAutoresizingFlexibleBottomMargin 自动调整view与superview底部部的距离保证顶部距离不变

以上这些都较易理解, 但是`autoresizing`还有一些组合场景。那就是组合使用的场景。

<table class="table_plain">
<tbody>
<tr>
<th style="width:25%;">autoresizingMask</th>
<th style="width:40%;">说明</th>
<th style="width:35%;">xib预览效果</th>
</tr>

<tr>
<td width="50">None</td>
<td>view的frame不会随superview的改变而改变（右图的xib中预览效果与实际效果有差，实际效果是view的上边距不变）</td>
<td><img src="/images/autoresizings/none.gif"></td>
</tr>

<tr>
<td width="50">TopMargin | BottomMargin</td>
<td>view与其superView的上边距和下边距的比例维持不变</td>
<td><img src="/images/autoresizings/top+bottom.gif"></td>
</tr>

<tr>
<td>LeftMargin | RightMargin</td>
<td>view与其superView的左边距和右边距的比例维持不变（右图的xib中预览效果与实际效果有差，实际效果是view的上边距不变）</td>
<td><img src="/images/autoresizings/left+right.gif"></td>
</tr>

<tr>
<td>LeftMargin | RightMargin | TopMargin | BottomMargin</td>
<td>view与其superView的上下左右边距的比例维持不变</td>
<td><img src="/images/autoresizings/left+right+top+bottom.gif">
</td>
</tr>

<tr>
<td>LeftMargin | Width </td>
<td>view与其superView的右边距的比例维持不变, 左边距和width按比例调整（右图的xib中预览效果与实际效果有差，实际效果是view的上边距不变）</td>
<td><img src="/images/autoresizings/left+width.gif">
</td>
</tr>

<tr>
<td>LeftMargin | Width | RightMargin </td>
<td>左边距、右边距、宽按比例调整，（右图的xib中预览效果与实际效果有差，实际效果是view的上边距不变）<label style="color:red;">垂直方向是同样效果，故不列举</label></td>
<td><img src="/images/autoresizings/left+width+right.gif">
</td>
</tr>

<tr>
<td>Width | Height </td>
<td>自动调整view的宽和高，保证上下左右边距不变。<label style="color:red;">如把tableView设置为此属性，那么无论viewController的view是多大，都能自动铺满</label></td>
<td><img src="/images/autoresizings/width+height.gif">
</td>
</tr>

</tbody>
</table>

上面并未列举所有组合场景，但是已经足够我们理解	`autoresizing` 了。

## 2. 小结

Autoreszing的最常见的实用场景就是iPhone5的兼容了。比如我们想要设置tableView的frame，那我们只需要在初始化设置frame之后将tableView的autoresizingMask设置为 `UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight` 就行了。

另一种比如我们想要一个view一直停留在其superview的最下方，那么我们在初始化设置frame之后只需要将autoresizingMask设置为`UIViewAutoresizingFlexibleTopMargin` 就可以了。

autorezingMask简单的一个属性，理解它之后可以让很多事情变得简单。