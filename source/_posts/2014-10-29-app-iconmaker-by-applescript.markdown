---
layout: post
title: "使用AppleScript制作一个AppIcon自动生成器"
date: 2014-10-29 12:13:21 +0800
comments: true
categories: AppleScript iconMaker
---

随着IOS的不断升级，我们需要app的icon的尺寸也越来越多，如下：

![](/images/iconMaker/icons_require.png)

如果让设计同学一张一张给，可能也会有些麻烦，在AppStore发现了一款工具叫 **Appicon and Launchimage Maker**, 用来自动生成xcode所需要的icon的所有size,还挺方便的，但是这个工具在Mac Retina上生成的图片的size都是实际需要尺寸的2倍，推测他们应该是用CoreGraphics重新绘制的，但是貌似这个App的开发者没有修复这个的打算，于是我想到了AppleScript.

<!-- more -->

## AppleScript

AppleScript 是一个强大的效率工具，语法简单，非开发人员也能利用它完成一些重复繁琐的工作。现在的网络上关于AppleScript的介绍也有不少，所以在这里不打算对AppleScript 做详细介绍。可以参看苹果的[AppleScript Language Guide](https://developer.apple.com/library/mac/documentation/AppleScript/Conceptual/AppleScriptLangGuide/introduction/ASLR_intro.html)

## iconMaker

不废话了，直接来做这个工具吧，需求如下：

1、 输入一张原始的icon图片，生成xcode所需要的所有图片规格，并配置好xcassets.

源码如下, 有兴趣的同学可以自己研究拓展：

``` c

set icon_image to (choose file with prompt "请选择icon的原图，大小推荐1024x1024的:") as string
set output_path to (choose folder with prompt "请选择输出目录:") as string

set size_list to { {name:"icon-29.png", size:29, idiom_p:"iphone", scale_p:"1x"} }

set size_list to size_list & { {name:"icon-29@2x.png", size:29, idiom_p:"iphone", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-29@3x.png", size:29, idiom_p:"iphone", scale_p:"3x"} }
set size_list to size_list & { {name:"icon-40@2x.png", size:40, idiom_p:"iphone", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-40@3x.png", size:40, idiom_p:"iphone", scale_p:"3x"} }
set size_list to size_list & { {name:"icon-57.png", size:57, idiom_p:"iphone", scale_p:"1x"} }
set size_list to size_list & { {name:"icon-57@2x.png", size:57, idiom_p:"iphone", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-60@2x.png", size:60, idiom_p:"iphone", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-60@3x.png", size:60, idiom_p:"iphone", scale_p:"3x"} }

set size_list to size_list & { {name:"icon-29.png", size:29, idiom_p:"ipad", scale_p:"1x"} }
set size_list to size_list & { {name:"icon-29@2x.png", size:29, idiom_p:"ipad", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-40.png", size:40, idiom_p:"ipad", scale_p:"1x"} }
set size_list to size_list & { {name:"icon-40@2x.png", size:40, idiom_p:"ipad", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-50.png", size:50, idiom_p:"ipad", scale_p:"1x"} }
set size_list to size_list & { {name:"icon-50@2x.png", size:50, idiom_p:"ipad", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-72.png", size:72, idiom_p:"ipad", scale_p:"1x"} }
set size_list to size_list & { {name:"icon-72@2x.png", size:72, idiom_p:"ipad", scale_p:"2x"} }
set size_list to size_list & { {name:"icon-76.png", size:76, idiom_p:"ipad", scale_p:"1x"} }
set size_list to size_list & { {name:"icon-76@2x.png", size:76, idiom_p:"ipad", scale_p:"2x"} }

set size_list to size_list & { {name:"icon-120.png", size:120, idiom_p:"car", scale_p:"1x"} }

set contents_json to "{
  \"images\" : [
    "

on removing folder items from output_path after losing these_items
end removing folder items from

on write_to_file(this_data, target_file, append_data) -- (string, file path as string, boolean)
	try
		set the target_file to the target_file as text
		set the open_target_file to ¬
			open for access file target_file with write permission
		if append_data is false then ¬
			set eof of the open_target_file to 0
		write this_data to the open_target_file starting at eof
		close access the open_target_file
		return true
	on error
		try
			close access file target_file
		end try
		return false
	end try
end write_to_file

tell application "Image Events"
	
	set total_count to the count of size_list
	repeat with i from 1 to the count of size_list
		set this_image to open icon_image
		set info to (item i of size_list)
		set result_name to the name of info
		set result_size to the size of info
		set the result_scale_p to the scale_p of info
		if the result_scale_p is "3x" then
			set result_size to result_size * 3
		else if the result_scale_p is "2x" then
			set result_size to result_size * 2
		else
			-- do nothing
		end if
		scale this_image to size result_size
		save this_image in output_path & result_name
		close this_image
		
		-- add json format to contents
		set size_value to the size of info as string
		set size_value to size_value & "x" & size_value
		set result_idiom to the idiom_p of info
		set inner_json to "{
      \"size\" : \"" & size_value & "\",
      \"idiom\" : \"" & result_idiom & "\",
      \"filename\" : \"" & result_name & "\",
      \"scale\" : \"" & result_scale_p & "\"
    }"
		if i is less than total_count then
			set inner_json to inner_json & ",
    "
		end if
		set contents_json to contents_json & inner_json
	end repeat
	
	set contents_json to contents_json & "
  ]
}"
end tell

set file_path to output_path & "Contents.json"
my write_to_file(contents_json, file_path, false)

```
如果你不想了解怎么用，我也打了个包，下载下来就可以用了：

[iconMaker.zip](http://pan.baidu.com/s/1i3mU4Ln)

## 无损压缩

最后，这种方法做出来的图片，是通过`Image Events`里面的scale做出来的，遵循图片大小小些好，我们可以再次对图片做下压缩，推荐无损压缩工具 [ImageOptim](https://imageoptim.com/)