---
layout: post
title: "数字证书"
date: 2014-03-24 17:36:45 +0800
comments: true
categories: 加密 证书
---

上一篇博客讲到了RSA加密算法，这里就写一下RSA应用最广泛的-数字证书。数字证书的作用就是在数据传输的过程中证明用户的身份，保证用户不是伪装的。

<!-- more -->

####为什么需要数字证书

假设一个正常的非对称加密通信如下：

![1](/images/shuzizhengshu_1.png)

现在假设有个黑客Sam获取了Cass的公钥，并伪装成Dean, 是完全可能的。那么就需要一种验证用户身份的机制，那就是数字证书。
####数字证书标准

**1、X.509版本号**：指出该证书使用了哪种版本的X.509标准，版本号会影响证书中的一些特定信息。目前的版本是3。

**2、证书持有人的公钥**：包括证书持有人的公钥、算法(指明密钥属于哪种密码系统)的标识符和其他相关的密钥参数。

**3、证书的序列号**：由CA给予每一个证书分配的唯一的数字型编号，当证书被取消时，实际上是将此证书序列号放入由CA签发的CRL（Certificate Revocation List证书作废表，或证书黑名单表）中。这也是序列号唯一的原因。

**4、主题信息**：证书持有人唯一的标识符(或称DN-distinguished name)这个名字在 Internet上应该是唯一的。DN由许多部分组成，看起来象这样：

CN=Bob Allen, OU=Total Network Security Division

O=Network Associates, Inc.

C=US

这些信息指出该科目的通用名、组织单位、组织和国家或者证书持有人的姓名、服务处所等信息。

**5、证书的有效期**：证书起始日期和时间以及终止日期和时间；指明证书在这两个时间内有效。

**6、认证机构**：证书发布者，是签发该证书的实体唯一的CA的X.500名字。使用该证书意味着信任签发证书的实体。(注意：在某些情况下，比如根或顶级CA证书，发布者自己签发证书)

**7、发布者的数字签名**：这是使用发布者私钥生成的签名，以确保这个证书在发放之后没有被撰改过。

**8、签名算法标识符**：用来指定CA签署证书时所使用的签名算法。算法标识符用来指定CA签发证书时所使用的公开密钥算法和HASH算法。

下面是截取了github的ssl证书的截图：

![2](/images/shuzizhengshu_2.png)
![3](/images/shuzizhengshu_3.png)
![4](/images/shuzizhengshu_4.png)

####数字证书的颁发过程

先上个图吧：
![5](/images/shuzizhengshu_5.png)

图中给出了基本的证书申请流程，这个流程一般体现的场景如：网页服务器从CA请求SSL证书用于https加密; 像苹果服务器请求开发者证书。

####CA与系统根证书

可能大家经常要听到CA这个词，那什么是CA呢，CA就是上图中的证书颁发机构，因为证书颁发机构关系到所有互联网通信的身份安全，因此一定要是一个非常权威的机构。所以这样的专门管理和颁发证书的机构就是CA机构。

CA证书可以具有**层级结构**，CA建立自上而下的信任链，下级CA信任上级CA，下级CA由上级CA颁发证书并认证。
如：![6](/images/shuzizhengshu_6.png)

如果说CA保证互联网交易安全的根本保证，那么系统根证书就是个人PC安全的根本保证。系统根证书里保存了受信任的CA证书的根证书，用户验证一个数字证书的正确性都是从系统根证书开始的。

如上图中： google.com.hk的ssl证书由 Google Internet Authority G2这个CA来验证。而Google Internet Authority G2由 GeoTrust Global CA来验证； GeoTrust Global CA由系统根证书Equifax Secure Certificate Authority来验证。

***如何查看系统根证书***
在mac系统的keychain中直接就可以查看了，在windows系统中在开始的搜索中直接键入：certmgr.msc，就可以打开证书查看器
**如果系统根证书被篡改，系统的安全性就受到威胁**

**所以，不要轻易的信任根证书，除非你是开发者，了解自己的所作所为**

####HTTPS加密过程

话不多说，先上一幅图：

![7](/images/shuzizhengshu_7.png)

由上可以看出https协议是很安全的，谷歌公司已经大力推广HTTPS的使用。

但是前提是不要轻易信任不明发布源的数字证书，不要改动系统根证书。在ASIHttpRequest中提供了一个属性：`validatesSecureCertificate`，当设置其位NO时，可以忽略对数字证书进行有效性验证。这样做是不安全的，因此建议我们平时在测试时可以将其设置为NO,但发布时最好还是设置为YES.

下面即将讲到一种监察的情况。

####为什么Fiddler可以抓https的数据包

如果你使用过Fiddler进行过网络抓包调试，应该发现Fiddler是可以抓取https网络请求的数据包的，以前我也有过疑惑，如果https这么容易就被Fiddler这样的工具截取到数据，那么还有什么安全性可言呢，还要https协议干嘛呢。但其实不然，https还是很安全的。下面就解释下为何Fiddler可以抓https的包。

**Fiddler对服务端充当客户端，对客户端充当服务端，并颁发证书给不同的domain**
![8](/images/shuzizhengshu_8.png)

但是Fidder不是正规的CA证书，它颁发的证书不受浏览器信任的，所以如果你的网络正被Fiddler这样的Middle Men监控着，那么https接请求都会报证书不受信任的，像这样：
![9](/images/shuzizhengshu_9.png)。但是如果代码中忽略了https中ssl证书合法性的验证，那么https的安全性就相当于没有了。所以不要把ASIHttpRequest中的`validatesSecureCertificate`属性单纯的设置为`NO`.

这篇博客先到这里吧。