---
layout: post
title: "NSJSONSerialization在IOS6上的陷阱"
date: 2014-09-19 17:44:48 +0800
comments: true
categories: NSJSONSerialization JSON
---
在IOS上进行JSON解析已经有了很多成熟的组件，如 [json-framework](https://github.com/stig/json-framework), [JSONKit](https://github.com/johnezang/JSONKit) 等等。还有cocoaTouch在IOS5之后推出的API: `NSJSONSerialization`。 起初我想当然的认为系统原生的肯定就是最好的，最适合的，但是还是实践出真知， `NSJSONSerialization` 对于我们不是最适合的，甚至有点糟糕： 在IOS6上会crash.

### crash的原因

在测试中，我听到了说JSON解析崩溃的问题，起初很惊讶，但是经过在网上一番搜索，发现stackoverflow上可以搜到`NSJSONSerialization`在IOS6上崩溃的问题。经过小伙伴们一系列的定位，终于确定`NSJSONSerialization`在IOS6上是有崩溃的问题了。你可能会问了，我也一直在用`NSJSONSerialization`，但是从来就没崩溃过啊。是的，在标准的JSON解析中，它的确工作良好，但是在不标准的JSON面前就会有问题。最后发现问题的原因：

在同一个dic内有重复的key值,如：

```json
{
	"name": "jason",
	"name": "jason"
}

```

而且在arm架构上会crash,在x86和i386架构上不会crash, 即在模拟器上不会崩。

凑巧我们的接口返回的JSON不是标准JSON，而是在jsp、freemarker等页面里面开发人员拼的JSON（对于这种情况已无力吐槽），这种情况下各种不标准的JSON情况层出不穷...

### 其他场景

stackoverflow上标出了另一种崩溃场景： [http://stackoverflow.com/questions/12842481/nsjsonserialization-results-in-exc-bad-access](http://stackoverflow.com/questions/12842481/nsjsonserialization-results-in-exc-bad-access).

就是遇到了用Unicode编码代替字符的时候也会导致崩溃， 如 `\u00e4` 来表示 `ä`.

### 小结

在任何关于框架级的设计和更改时，一定要谨慎，最好的不一定是最适合的。全面的测试是必要的。