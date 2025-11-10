---
layout: post
title: "IOS7.1下使用AdHoc方法下载的解决方案"
date: 2014-03-25 17:16:19 +0800
comments: true
categories: AdHoc, https自签证书
---


最近苹果发布了IOS7.1。话说苹果每次发布都牵动开发者的心哈，这次让我们又小纠结了一阵。

废话不多说，说下AdHoc在ios7.1不能下载的原因，就是ios7.1不接受未经ssl验证的manifest了，就意味着plist文件的路径需要从http换为https：

	itms-services://?action=download-manifest&url=http://domain.com/app.plist
	==> //更换为
	itms-services://?action=download-manifest&url=https://domain.com/app.plist

看起来貌似简单一点改动啊，但是如果你和我一样在局域网里面搭了个apache，写了一些php代码，可以自动上传包上去给测试人员下载测试的话，那就要麻烦一些了，网上有些说用dropbox. 这个方案的确可行，但是我们是内网环境啊，dropbox访问不了啊，那只能想办法让容器支持https.

本文主要介绍了如何使用openssl命令行自签证书，并部署到apache服务器的步骤

<!-- more -->

####Apache2支持https

我用的时CentOS6系统和Apache2服务器，如果你用的不同的环境，也可以参考下，起码也可以知道解决的思路。

#####1、首先你得apache要支持mod_ssl，如果没有就安装下，安装也简单了

	yum install mod_ssl

*如果是其他的系统就按对应的安装方案*

#####2、生成自签名的CA证书和服务器证书

2.1用openssl选择rsa非对称算法和des3对称加密算法来制作CA证书：

	openssl genrsa -des3 -out my-ca.key 2048
	
上面会生成一个密钥长度2048位的密钥,，保存在my-ca.key文件中，这个文件会要求你输入个密码，这个密码后面用到这个文件时都会用到。

2.2然后使用x509标准签署证书

	openssl req -new -x509 -days 3650 -key my-ca.key -out my-ca.crt
	
上面这步生成了有效期10年的CA证书文件 my-ca.crt,这个过程会让你填一些基本信息，比如国家城市，公司名，网站名等等，因为是自签署，随便填就行了。

2.3然后我们可以用下面这个命令查看下这个证书(不看也行)：

	openssl x509 -in my-ca.crt -text -noout
	
2.4现在有了CA证书了，就可以用它来为我们的网站颁发ssl证书了。同制作CA证书一样，我们需要先为服务器生成密钥对。

	openssl genrsa -des3 -out mars-server.key 2048
	
2.5生成了密钥mars-server.key后，根据它生成csr证书文件

	openssl req -new -key mars-server.key -out mars-server.csr
	
执行上述命令时同样要输入一些基本信息，这里面要注意了Common Name的值要和你的域名一致，否则后面客户端浏览器验证域名不正确会不通过的。这里我是局域网就填了局域网的ip，如果10.21.122.22， 因此如果你的局域网的主机的ip变了的话，就需要重新颁发下证书了。所以建议直接在路由或交换上把你的主机设置为固定ip.

2.6下面就用CA证书来签署服务器证书了：

	openssl x509 -req -in mars-server.csr -out mars-server.crt -sha1 -CA my-ca.crt -CAkey my-ca.key -CAcreateserial -days 3650

到这里，我们所需要的证书就完全做成了。下面需要做的就是部署到Apache里面了。

#####3、部署到Apache

3.1创建一个目录放证书文件，如放在`/etc/apache2/ssl`下，包括3个文件，分别是：`my-ca.crt` `mars-server.crt` `mars-server.key`.

3.2在生成mars-server.key的过程中，可能对这个文件设置了密码，如果直接部署，那么以后启动apache的时候都要输入这个密码，但是一般我们都开机自动启动apache，手动启动多麻烦啊，可以把这个文件转换一下，省去输入密码步骤：

	cd /etc/apache2/ssl
	openssl rsa -in mars-server.key -out mars-server.key.insecure

3.3修改Apache的ssl配置，比如我是centOS放在 /etc/httpd/conf.d/ssl.conf中，分别把以下四个选项的配置修改为刚生成的文件。
	
	SSLEngine On
	SSLCertificateFile /etc/apache2/ssl/mars-server.crt
	SSLCertificateKeyFile /etc/apache2/ssl/mars-server.key.insecure
	SSLCACertificateFile /etc/apache2/ssl/my-ca.crt
	
3.4重启apache服务器

	apachectl stop
	apachectl start

到这里，自签名的https服务就可以了，在浏览器里面打`https://localhost/`就可以看到浏览器报红啦，添加证书信任后就可以继续访问了
	
####让用户自己安装crt证书

到这里没有完呢，因为这里CA证书使我们自己创建的，在手机里面没有我们的根证书啊，用手机safari还是不能访问啊，如何解决呢。方案很简单，就是让用户自己下载安装证书先。

在服务器上把CA证书my-ca.crt文件拷贝的容器中某个可以访问的路径下，比如放在网站根目录下，在你的首页添加个下载证书的链接就行啦，然用户自己下载证书安装到手机，安装完成就可以正常下载啦。在首页添加html标签

``` html
	<a href="./my-ca.crt" style="color: red; font-weight: bold; font-size: 18px;">下载前请先安装证书</a>
```
到这里就OK拉。
