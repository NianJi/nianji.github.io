---
layout: post
title: "使用CocoaLumberjack和XcodeColors实现分级Log和控制台颜色"
date: 2014-06-06 10:18:53 +0800
comments: true
categories: Log XcodeColors
---


Xcode是一款非常优秀的IDE,但是在日志打印上貌似没有那么多高级的特性，比如分级打印，显示颜色。本博客就介绍下两个开源组件结合使用达到如下效果：

![XcodeColors](/images/XcodeColors.png)

<!-- more -->
##1.CocoaLumberjack

###1.1基本介绍

CocoaLumberjack是一个开源工程，为Xcode提供分级打印的策略，源码地址就是[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack)

CocoaLumberjack包含几个对象分别可以把Log输出到不同的地方：

* DDASLLogger  输出到Console.app
* DDTTYLogger  输出到Xcode控制台
* DDLogFileManager 输出到文件
* DDAbstractDatabaseLogger 输出到DB

通过ddLogLevel的int型变量或常量来定义打印等级

* LOG_LEVEL_OFF 关闭Log
* LOG_LEVEL_ERROR  只打印Error级别的Log
* LOG_LEVEL_WARN   打印Error和Warning级别的Log
* LOG_LEVEL_INFO   打印Error、Warn、Info级别的Log
* LOG_LEVEL_DEBUG  打印Error、Warn、Info、Debug级别的Log
* LOG_LEVEL_VERBOSE 打印Error、Warn、Info、Debug、Verbose级别的Log

使用不同的宏打印不同级别的Log

* DDLogError(frmt, ...)		打印Error级别的Log
* DDLogWarn(frmt, ...)		打印Warn级别的Log
* DDLogInfo(frmt, ...)		打印Info级别的Log
* DDLogDebug(frmt, ...)		打印Debug级别的Log
* DDLogVerbose(frmt, ...)	打印Verbose级别的Log

###1.2设置LogFormatter

我们可以定制自己的Log的方式。通过创建一个类实现`DDLogFormatter`协议的方法`- (NSString *)formatLogMessage:(DDLogMessage *)logMessage;`,如下创建一个`MyLogFormatter`类，并实现如下方法：

``` objc

	- (NSString *)formatLogMessage:(DDLogMessage *)logMessage{
	
    NSString *logLevel = nil;
    switch (logMessage->logFlag)
    {
        case LOG_FLAG_ERROR:
            logLevel = @"[ERROR] >  ";
            break;
        case LOG_FLAG_WARN:
            logLevel = @"[WARN]  >  ";
            break;
        case LOG_FLAG_INFO:
            logLevel = @"[INFO]  >  ";
            break;
        case LOG_FLAG_DEBUG:
            logLevel = @"[DEBUG] >  ";
            break;
        default:
            logLevel = @"[VBOSE] >  ";
            break;
    }
    
    NSString *formatStr = [NSString stringWithFormat:@"%@[%@ %s][line %d] %@",
                           logLevel, logMessage.fileName, logMessage->function,
                           logMessage->lineNumber, logMessage->logMsg];
    return formatStr;
}

```

上面的例子中我们定制了Log能打印自己的等级、类和方法、代码行数。

###1.3初始化

CocoaLumberjack的引擎需要我们自己来启动。下面的示例代码

``` objc

	//set formatter
    MyLogFormatter *formatter = [[MyLogFormatter alloc] init];
    
	//添加输出到Xcode控制台
	[[DDTTYLogger sharedInstance] setLogFormatter:formatter];
	[DDLog addLogger:[DDTTYLogger sharedInstance]]; 
	
	//添加输出到Console
	[[DDASLLogger sharedInstance] setLogFormatter:formatter];
	[DDLog addLogger:[DDASLLogger sharedInstance]]; 

	//添加文件输出
    DDFileLogger *fileLogger = [[DDFileLogger alloc] init];
    fileLogger.rollingFrequency = 60 * 60 * 24; // 一个LogFile的有效期长，有效期内Log都会写入该LogFile
    fileLogger.logFileManager.maximumNumberOfLogFiles = 7;//最多LogFile的数量
    [fileLogger setLogFormatter:formatter];
    [DDLog addLogger:fileLogger];
    
    //添加数据库输出
    DDAbstractDatabaseLogger *dbLogger = [[DDAbstractDatabaseLogger alloc] init];
    [fileLogger setLogFormatter:formatter];
    [DDLog addLogger:dbLogger];
```

##2.XcodeColors

###2.1安装
XcodeColors是一个Xcode插件，源码地址：[XcodeColors](https://github.com/robbiehanson/XcodeColors); 代码下下来后打开工程run一次，插件就自动安装到了`~/Library/Application\ Support/Developer/Shared/Xcode/Plug-ins/XcodeColors.xcplugin`路径下。
**安装完成重启Xcode**

###2.2配置scheme

在Scheme中配置Environment Variables, 添加参数XcodeColors为YES.如下图

![](/images/XcodeColors_scheme.png)

###2.3为DDLog打开颜色

	[[DDTTYLogger sharedInstance] setColorsEnabled:YES];
	
###2.4为特定的Log级别设定颜色

	[[DDTTYLogger sharedInstance] setForegroundColor:RGBCOLOR(0, 0, 255)
                                     backgroundColor:nil
                                             forFlag:LOG_FLAG_INFO];
                                             
完成以上步骤就可以看到控制台的不同颜色的打印了。。

