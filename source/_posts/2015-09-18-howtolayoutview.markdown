---
layout: post
title: "如何做好IOS View的布局"
date: 2015-09-18 21:17:51 +0800
comments: true
categories: 能工巧匠集
---

这个命题貌似有点大，那就尽量将我理解的分享一下吧，首先说明一点，我是代码党，所以我所讲的都是代码布局。本文会围绕一些我们平常开发中常遇到的布局问题来进行叙述，包括以下几个方面：

* 如何布局UIViewController的view
* childViewController的处理
* Autolayout来布局
* tableView管理   

<!-- more -->


### 1.如何布局UIViewController的view

首先给出设计原则：

* a. 屏幕尺寸变化时能自适应，如不同尺寸设备，屏幕旋转，热点，电话等。
* b. 无论是否有navigationBar或tabBar都能够正常显示，即要考虑是否有这些bar的所有场景
* c. 尽量避免hard code间距，如20，44，49等

#### 1.1 是否全屏

自从ios7扁平化设计以来，高斯模块是为你的应用增色的很好的工具，而为了更好的让navigationBar和tabBar实现高斯模糊的效果，最好让UIViewController能够全屏布局。我们在设计一个页面时，最好先确定好是否需要全屏布局，确定了这一点，我们就很简单的这样设置来决定是否全屏布局。

不需要全屏布局: 

```objc
    self.edgesForExtendedLayout = UIRectEdgeNone;
```

需要全屏布局：

```objc
	self.extendedLayoutIncludesOpaqueBars = YES;
	// 在ios7.1以后，ios会根据navigationBar的translucent来自动确定是否全屏。
```

#### 1.2 subview的布局

对于subview的frame设置不难，重要的是要做到以下2点：

> a. 在ViewController的view尺寸变化时能自适应，如屏幕旋转，热点，电话等。
  b. 无论是否有navigationBar或tabBar都能够正常显示

做到第一点不难，不使用Autolayout也可以做到，那就是设置view的 `autoresizingMask`, 这个属性在还是frame布局时代是适配的利器。比如这样设置就可以让subview始终和view的尺寸一致：

```objc
tableView.frame = self.view.bounds;
tableView.autoresizingMask = UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth;
```
这个的详细使用可以参考[Autoresizing](http://blog.cnbluebox.com/blog/2014/09/09/appkai-fa-zhe-xu-yao-wei-iphone6zuo-chu-gai-bian/)这里面的介绍，本文不详细描述。

但是要做到第二点不使用Autolayout就有点捉襟见肘了，因为ios7以上全屏布局到处都是，为了能更好适配不至于navigationBar或者tabBar挡住了内容，当然你可以说不需要全屏，但是有一种情况你还要考虑：

> 在没有navigationBar的情况下，statusBar的高度不被考虑，于是你又不得不做出判断，当没有navigationBar的情况下，view上面留20像素来避免被statusBar挡住。

那如何来做呢，答案就是使用 `LayoutGuide`， 例如这个：

```objc
[view mas_makeConstraints:^(MASConstraintMaker *make) {
    make.top.mas_equalTo(self.mas_topLayoutGuideBottom);
    make.leading.mas_equalTo(self.view.mas_leading);
    make.trailing.mas_equalTo(self.view.mas_trailing);
    make.bottom.mas_equalTo(self.mas_bottomLayoutGuideTop);
}];
```

> 本文autolayout均使用 Masonry 作为示例，如果你不了解Masonry，请参考[Masonry](https://github.com/SnapKit/Masonry)

上面的示例代码就保证了view不会被顶部或者底部的“条”遮住。

#### 1.3 scrollView的contentInset

上面一小节的例子说明了如何在view是全屏的时候如何布局subview不被挡住， 但是如果我的subview是 UIScrollView, 也要全屏布局呢(为了炫酷的高斯模糊效果）， 一般的做法就是设置 contentInset来避免内容被挡住, 这里我的答案是设置`automaticallyAdjustsScrollViewInsets`， 你是不是想：不是逗我吧，这东西不是坑么，很容易不起作用的。下面我来解释下。

为什么要使用`automaticallyAdjustsScrollViewInsets`就是我们要依从上面原则中的b. 不依赖当前是否有navigationBar或者tabBar来hardCode布局subview。 当然你也可以通过判断当前是否有navigationBar或者tabBar来手动计算，但是这样不是感觉有点dirty么。

苹果设计UIViewController的`automaticallyAdjustsScrollViewInsets`这个属性就是为了应对scrollView的全屏布局的，会依据viewController所处的环境（是否有navigationBar或者tabBar之类的bar）， 在UIViewController的view moveToWindow的时候，自动设置scrollView的 `contentInset` 和 `scrollIndicatorInsets`来保证内容不被挡住， 但完美使用且不出问题要满足以下的条件：

* UIScrollView是 UIViewConroller的view的第一个subview.
* UIScrollView的位置正好是view的bounds

我想说的是，我们完全可以满足上面两点要求，经过我实践的经验，如果你的布局设计稿满足不了以上两点要求的页面，这样的页面也没有什么需要全屏的必要，这种情况下就不要全屏就好了嘛。当然如果你还是会有这样的需求，也有方法，参考2.2

#### 1.4 SCREEN_WIDTH 和 SCREEN_HEIGHT

相信很多同学的工程里面一定可以搜到这两个宏，或者类似的东西，即是在我们使用了Autolayout布局之后，某些场景可能还是会让我们使用到这两个参数。比如设置 `preferredMaxLayoutWidth`(IOS7,IOS8已经可以自动) 的时候，很多时候直接用SCREEN_WIDTH来计算。

但是这两个东西也算是HARD CODE啊，只是目前用起来还好，其实也应该摒弃，像ipad分屏出来以后，这个东西就成了麻烦的事情了，但是麻烦我们也要解决啊，不然久而久之这个一定会是个坑的。

思考为了移除 `SCREEN_WIDTH` 和 `SCREEN_HEIGHT`, 我们需要兼顾哪些事情呢？

* 尽量依赖相对关系来计算size
* 类似 `preferredMaxLayoutWidth` 这样的属性也要去除依赖
* 在view的size变化时，`preferredMaxLayoutWidth`可以对应更改

上面做到第一点应该不难，用Autolayout完全满足，第二点和第三点可以给个参考，在view的`layoutSubviews`里面根据当前的`size`大小来设置 `preferredMaxLayoutWidth`，有人实际操作过可行，在IOS7上也实现了 `Automatic` 的 `preferredMaxLayoutWidth`。

#### 1.5 IOS6问题

本来也想讲讲IOS6的兼容，但是现在淘宝天猫都开始不兼容IOS6了，还费精力干啥，把精力放到更有意义的事上吧，如果你们老板还在要兼容IOS6，你就打开淘宝天猫最新版，说：看！淘宝都不兼容了。

### 2. childViewController

在开发过程中，发现还有小部分同学对 `childViewController`的用法是错误的，你是否见过这样的代码呢？

```objc
	TestViewController *vc = [[TestViewController alloc] init];
    [vc willMoveToParentViewController:self];
    [self addChildViewController:vc];
    [self.view addSubview:vc.view];
    [vc didMoveToParentViewController:self];
```
其实这里面第二行是多余的，具体如何使用，苹果的注释里面很清楚了：

> These two methods are public for container subclasses to call when transitioning between child
  controllers. If they are overridden, the overrides should ensure to call the super. The parent argument in
  both of these methods is nil when a child is being removed from its parent; otherwise it is equal to the new
  parent view controller.

>  addChildViewController: will call [child willMoveToParentViewController:self] before adding the
  child. However, it will not call didMoveToParentViewController:. It is expected that a container view
  controller subclass will make this call after a transition to the new child has completed or, in the
  case of no transition, immediately after the call to addChildViewController:. Similarly
  removeFromParentViewController: does not call [self willMoveToParentViewController:nil] before removing the
  child. This is also the responsibilty of the container subclass. Container subclasses will typically define
  a method that transitions to a new child by first calling addChildViewController:, then executing a
  transition which will add the new child's view into the view hierarchy of its parent, and finally will call
  didMoveToParentViewController:. Similarly, subclasses will typically define a method that removes a child in
  the reverse manner by first calling [child willMoveToParentViewController:nil].
  
  大概意思是：
   1. 重载 `willMoveToParentViewController:` 和 `didMoveToParentViewController:`时不要忘了super
   2. `addChildViewController`的时候只需要在后面调用 `didMoveToParentViewController:`
   3. `removeChildViewController`的时候只需要在前面 `willMoveToParentViewController:`
   4. 如果有切换动画应该先 `addChildViewController` 再将`view`添加到parentView上并做切换动画，动画结束再`didMoveToParentViewController:`
   
   好了，今天讲的是 childViewController里面的布局问题，同样会遇到上面的问题：
   
#### 2.1 childViewController的layoutGuide

在 `childViewController` 中使用 `layoutGuide` 不那么好使了， IOS7上完全不对，IOS9上可以正常工作，IOS8还没有测。那如何解决呢，解决方案可以取其 `parentViewController`的layoutGuide嘛，参考[toplayoutguide-in-child-view-controller](http://stackoverflow.com/questions/19140530/toplayoutguide-in-child-view-controller)

当然取出来的 layoutGuide 可不能直接在Autolayout里面使用了，但是可以取其 `length` 来进行使用。

#### 2.2 childViewController的 contentInset

在 `childViewController` 中 `automaticallyAdjustsScrollViewInsets` 也没用了， 解决方案可以同 2.1 取其 parentViewController的 layoutGuide 的length来进行设置， 这里面有个细节要注意，就是设置 contentInset 的方法放在 `viewWillLayoutSubviews` 函数里面才最佳。

### 3. Autolayout

上面讲了一些关于 viewController 怎么处理布局的问题，下面就列举一些实用布局的实例来解释如何用Autolayout来布局，已经其好处和必要性。

#### 3.1 组合区块

这一节我们举例一个简单的区块布局，常见一些电商类活动资源模板建立。需求如下：


<pre style="background:#333333;color:#ffffff">
   _______________________________________________________________________
  |  _______________3________________   ________________3_______________  |
  | |                                | |                                | |
  | |                                | |                                | |
  | |                                | |                                | |
  | |                                | |                                | |
  | |                                | |             view2              | |
  | |                                | |                                | |
  | |                                | |                                |3|
  | |                                |3|                                | |
  | |           view1                | |________________________________| |
  |3|                                |  _______3______   _______3_______  |
  | |                                | |              | |               | |
  | |                                | |              | |               | |
  | |                                | |              | |               | |
  | |                                | |              | |               | |
  | |                                | |    view3     | |     view4     | |
  | |                                | |              | |               | |
  | |                                | |              | |               | |
  | |                                | |              | |               | |
  | |________________________________| |______________| |_______________| |
  |_____________3__________________________________3______________________|

</pre>

其中 `view1` 和 `view2` 同宽， `view2` 和 `view3`, `view4` 同高， `view3` 和 `view4` 同宽， 所有的margin都是3。要完成这样要求的布局，可以很容易的用Autolayout来完成, 只需要指定好这些间距和宽度的关系就好了。

```objc
[view1 mas_makeConstraints:^(MASConstraintMaker *make) {
    make.leading.mas_equalTo(superview.mas_leading).offset(3);
    make.top.mas_equalTo(superview.mas_top).offset(3);
    make.bottom.mas_equalTo(superview.mas_bottom).offset(-3);
    make.width.mas_equalTo(view2.mas_width);
}];

[view2 mas_makeConstraints:^(MASConstraintMaker *make) {
    make.leading.mas_equalTo(view1.mas_trailing).offset(3);
    make.top.mas_equalTo(superview.mas_top).offset(3);
    make.trailing.mas_equalTo(superview.mas_trailing).offset(-3);
    make.height.mas_equalTo(view3.mas_height);
}];

[view3 mas_makeConstraints:^(MASConstraintMaker *make) {
    make.leading.mas_equalTo(view2.mas_leading).offset(3);
    make.width.mas_equalTo(view4.mas_width);
    make.top.mas_equalTo(view2.mas_bottom).offset(3);
    make.bottom.mas_equalTo(superview.mas_bottom).offset(-.offset(3)3);
}];

[view4 mas_makeConstraints:^(MASConstraintMaker *make) {
    make.leading.mas_equalTo(view3.mas_trailing).offset(3);
    make.trailing.mas_equalTo(view2.mas_trailing);
    make.top.mas_equalTo(view2.mas_bottom).offset(3);
    make.bottom.mas_equalTo(superview.mas_bottom).offset(-3);
}];

```

如何正确的设置 `Constraints` 的原则就是：

>  `Contraints` 设置的条件满足可以计算出view的frame. 

相信大家对于这点数学基础应该没问题的。明白则个基本原则后，然后就要了解ios系统框架已经做了哪些事情，不然你可能不知道条件已经足够了，比如我们即将讲到的 `UILabel`


#### 3.2 UILabel

之所以把 `UILabel` 单拿出来讲，是因为其布局的特殊性，可能需要根据内容来决定其真实view的size.

##### 3.2.1 content Hugging & content Compression

有没有发现，你放一个 `UILabel` 在view上，然后只添加2个Constraint（top and leading）， 这个Label也可以正常显示，也没有报警告或者crash， 这是为什么呢，打印一下发现 label 上有两个 constraint:

```
(lldb) po [0x14664e5a0 constraints]
<__NSArrayI 0x1466100b0>(
<NSContentSizeLayoutConstraint:0x146563690 UILabel:0x14664e5a0.width == 41.6667>,
<NSContentSizeLayoutConstraint:0x1465637a0 UILabel:0x14664e5a0.height == 20.3333>
)
```
这就是 content Hugging 或 content Compression 起作用了，api如下：

```
- (UILayoutPriority)contentHuggingPriorityForAxis:(UILayoutConstraintAxis)axis NS_AVAILABLE_IOS(6_0);
- (void)setContentHuggingPriority:(UILayoutPriority)priority forAxis:(UILayoutConstraintAxis)axis NS_AVAILABLE_IOS(6_0);

- (UILayoutPriority)contentCompressionResistancePriorityForAxis:(UILayoutConstraintAxis)axis NS_AVAILABLE_IOS(6_0);
- (void)setContentCompressionResistancePriority:(UILayoutPriority)priority forAxis:(UILayoutConstraintAxis)axis NS_AVAILABLE_IOS(6_0);
```
在xib中看起来是这样的
![](/images/viewLayout1.png)

这两个属性是当 UIView 的 `intrinsicContentSize` 不为 `UIViewNoIntrinsicMetric` 的时候， 分别代表 ① view的边缘紧紧贴着它的内容 ② view的不透明的内容不会被压缩或者截断。

这两个属性不光是UILabel, UIImageView, UIButton等都可以使用。知道这两个属性对我们在同向多个view布局时选择如何布局有很重要的作用。

##### 3.2.2 计算text，attributeText文本的高度

在以往的节目开发中我们经常会要预先计算 text文本的高度，然后再根据计算出来的结果设置UILabel的frame，在纯文本时代做起来顺风顺水。但是进入富文本时代后，你会发现一个问题：*text的size计算不准* 。 而且现在富文本的需求，比比皆是，UILabel使用富文本也在ios6之后变的easy. 但是如果还是用老的方案来设置UILabel的frame, 你会发现总有瑕疵，很可能发现文本高度计算不对，被截掉内容了。即使用系统的新api: `-boundingRectWithSize:options:attributes:context:`, 也存在在计算不准的情况, 我就遇到过，当设置文本段的 `firstLineHeadIndent` 之后，计算出来的size也会发生有偏差的情况下。

那么，有了Autolayout之后，既然计算不准，而且又要写一堆计算高度的代码（比如计算cell高度），增加了代码的阅读复杂度和可维护度，那就不计算了，让Autolayout自己算出来！

使用上面的思路，我们可以在cell里面设置好constraints之后，先预填一下内容，让cell自己先布局一遍，拿到计算的结果保存起来，避免二次计算。那么我们就可以实现cell高度的自动计算了，既省事，又准确，只是使用时要设计方案避免多余的性能损耗。


#### 3.3 小结

Autolayout分享到这吧，我前面也已经写过2篇关于Autolayout的了，这里就不多重复了。

### 4. tableView管理

tableView 作为ios开发最常用的页面控件，可以说是大家最熟悉不过的了，今天我们讨论一个大家都有类似体会的经历：

*Step1:*

我们接到一个需求：要做一个展示商品或帖子详情的页面，第一行展示图片，第二行展示名称介绍价格等，第三行展示相关权益，第四行选择商品簇，第五行展示评价。

我们先假设用了最没有设计的做法：就是在tableView的dataSource和delegate方法里面直接if/else判断：
```
if (index == 0) {
    //图片行
} else if (index == 1) {
	//名称 介绍 价格
} else if (index == 2) {
	//相关权益
} else if (index == 3) {
	// 商品簇
} else if (index == 4) {
	// 评价
}
```
ok， 开发完了，上线，工作良好。

*Step2:*

二期，PD说我们要做抢购，那这个商品页如果是抢购商品的话 第二行要加一行 抢购相关信息，比如倒计时，这个时候，这个时候再想想 Step1 的设计，还要继续吗，试想一下要如何 if/else才能解决？最终肯定是发现再这样搞就成了一坨了，那么这样的设计显然不合理， 就算加班搞定了，那以后再变更呢，这个坑只能越来越大。那如何重构呢？

其实这种情况是因为RPC获取的Model并不是我们最终用来布局tableView所需要的 viewModel. 我们需要根据tableView的特性抽象出来一个`[{section:[row,row,row...]},{section:[row,row,row...]}, ...]`这样结构的`tableModel`, 然后我们就可以先将 `Model` 解析为这个 `tableModel`， 然后根据这个 `tableModel` 来布局 tableView. 这样设计以后，我们就把业务逻辑和布局逻辑分开了，甚至都不用修改 tableView 的代理方法了。

*Step3:*

经过Step2的重构，以后再改动需求过来，修改界面逻辑就不那么负责了，但是思考下日常中遇到这种情况的页面不在少数，那么为什么不把 `tableModel` 这一块封装成组件呢，毕竟tableView的布局都是类似的。

那么封装组件的话，我们要思考做到哪些设计：

* 低侵入性，不希望还要重载 `UITableView`, 或者 tabelView的 `dataSource`或`delegate`必须指向某个对象，这些设计对于原生的改造成本太高，而且造成了耦合，不利于维护。
* tableModel 自身可以方便的进行编辑, 比如增删改查 sectionModel， 增删改查 rowModel， 根据indexPath查找Model，和根据model查询indexPath都方便。
* 能够基本做到tableView布局变化不用改动 dataSource 方法
* 能够缓存cell高度，避免重复计算
* 实现Autolayout的cell自动计算高度并缓存。

基于以上几个原则，我开发了[NJEasyTable](https://github.com/NianJi/NJEasyTable)，有兴趣的同学可以使用看看。欢迎提issue.

### 5. 小结

本文对一些ios布局上做了一些总结，提出了一些建议和原则，希望可以帮助到一部分人，当然如果有错误，欢迎指正。


