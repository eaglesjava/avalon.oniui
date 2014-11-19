/**
 * @cnName 气泡组件
 * @enName tooltip
 * @introduce
 *  <p> 给一个元素或者给元素里满足配置条件的系列元素添加一个富UI及交互的气泡提示框
</p>
 */
define(["avalon", "text!./avalon.tooltip.html", "../position/avalon.position",  "css!./avalon.tooltip.css","css!../chameleon/oniui-common.css"], function(avalon, template) {

    var widget = avalon.ui.tooltip = function(element, data, vmodels) {
        var options = data.tooltipOptions
            , selfContent = ""
            , hideTimer
            , animateTimer
            , tooltipElem
            , customAt = options.positionAt
            , customMy = options.positionMy
            , lessH = 2
            , lessW = 1
            , arrH = 10
            , arrW = 10
            , p = options.position
            , constantInited
            , _event
            , ofElement
            , _event_ele
            , _track_event
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        function _init(p) {
            var cName = "left",
                p = p == void 0 ? options.position : p
            if(!(customMy && customAt)) {
                switch (p) {
                    case "tc"://正上方
                        customMy = "center bottom-" + arrH
                        customAt = "center top"
                        cName = "bottom"
                        break;
                    case "tl": //上方靠左
                        customMy = "left bottom-" + arrH
                        customAt = "left top"
                        cName = "bottom"
                        break
                    case "tr": //上方靠右
                        customMy = "right bottom-"  + arrH
                        customAt = "right top"
                        cName = "bottom"
                        break
                    case "lt"://左方靠上
                        customMy = "right-" +  arrW + " top"
                        customAt = "left top"
                        cName = "right"
                        break
                    case "lc"://正左方
                        customMy = "right-" +  arrW + " center"
                        customAt = "left center"
                        cName = "right"
                        break
                    case "lb"://左方靠下
                        customMy = "right-" +  arrW + " bottom"
                        customAt = "left bottom"
                        cName = "right"
                        break
                    case "rt"://右方靠上
                        customMy = "left+" +  arrW + " top"
                        customAt = "right top"
                        cName = "left"
                        break
                    case "rc"://正右方
                        customMy = "left+" +  arrW + " center"
                        customAt = "right center"
                        cName = "left"
                        break
                    case "rb"://右方靠下
                        customMy = "left+" +  arrW + " bottom"
                        customAt = "right bottom"
                        cName = "left"
                        break
                    case "bl"://下方靠左
                        customMy = "left top+" + arrH
                        customAt = "left bottom"
                        cName = "top"
                        break
                    case "bc"://正下方
                        customMy = "center top+" + arrH
                        customAt = "center bottom"
                        cName = "top"
                        break
                    case "br"://下方靠右
                        customMy = "right top+" + arrH
                        customAt = "right bottom"
                        cName = "top"
                        break
                    case "cc"://居中
                        customMy = customAt = "center center"
                        cName = "bottom"
                        break
                    default:
                        customMy = "left top+" + arrH
                        customAt = "left bottom"
                        cName = "bottom"
                        break
                }
            } else {
                var ats = customAt.replace(/[0-9\+\-]+/g, "").split(/\s+/),
                    mys = customMy.replace(/[0-9\+\-]+/g, "").split(/\s+/)
                // top or bottom
                if(ats[0] == mys[0]) {
                    if(ats[1] == "top") {
                        cName = "bottom"
                    } else {
                        cName = "top"
                    }
                } else if(ats[1] == mys[1]) {
                    if(ats[0] == "left") {
                        cName = "right"
                    } else {
                        cName = "left"
                    }
                } else {
                    cName = mys[1] || "bottom"
                }
            }
            return cName
        }

        var vmodel = avalon.define(data.tooltipId, function(vm) {
            avalon.mix(vm, options)
            if(vm.content == void 0) vm.content = element.getAttribute("title")
            vm.widgetElement = element
            vm.arrClass = "left"
            var tooltipElems = {}
            vm.$skipArray = ["widgetElement", "template", "delegate"]
            vm.toggle = ""
            var inited
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true

                vmodel.arrClass = _init(vmodel.position)
                // 埋个钩子
                vmodel.widgetElement.setAttribute("oni-tooltip-id", vmodel.$id)

                if(vmodel.event == "mouseenter" && vmodel.delegate) {
                    vmodel.event = "mouseover"
                }
                tooltipElem = tooltipELementMaker()
                avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                vmodel.event && element.setAttribute("ms-" + vmodel.event + "101", "__show($event)")
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
           
            vm.$remove = function() {
                if(tooltipElem && tooltipElem.parentNode) tooltipElem.parentNode.removeChild(tooltipElem)
            }
            //@interface show(elem) 不建议使用这个方法，请使用showBy({target: ele})显示tooltip，相对于elem定位，elem为元素或者event事件对象，如果elem为空，则采用之前缓存的对象，两者都为空，则只展示，不改变位置
            vm.show = function(elem) {
                if(vmodel.disabled || !tooltipElem) return
                tooltipElem.style.display = "block"
                if(!vmodel.toggle) vmodel.toggle = true
                if(elem == void 0) elem = ofElement
                if(elem) {
                    ofElement = elem
                    var tipElem = avalon(tooltipElem), 
                        atEle = avalon(elem), 
                        tipElemAt = customAt, 
                        tipElemMy = customMy,
                        bs = tooltipElem.getElementsByTagName("b"), 
                        arrOut, 
                        arrIn
                    for(var i = 0, len = bs.length; i < len; i++) {
                        var tb = avalon(bs[i])
                        if(tb.hasClass("oni-tooltip-arrow-out")) {
                            arrOut = tb
                        } else if(tb.hasClass("oni-tooltip-arrow-in")) {
                            arrIn = tb
                        }
                    }
                    /*if(arrOut && arrIn) {
                        var w = arrOut[0].offsetWidth,
                            h = arrOut[0].offsetHeight
                        lessW = w - arrIn[0].offsetWidth
                        lessH = h - arrIn[0].offsetHeight
                        根据arr元素的实际宽高初始化常量
                        if(!constantInited) {
                            vmodel.arrClass = _init(vmodel.position)
                            constantInited = true
                        }
                    }*/
                    // 定位toolp元素
                    tipElem.position({
                        of: elem, 
                        at: tipElemAt, 
                        my: tipElemMy, 
                        collision: vmodel.collision, 
                        within: document.body
                    })
                     // position组件自动调整的时候调整箭头上下朝向
                    if(elem.nodeName) {
                        if(tipElem.position().top > atEle.position().top + elem.offsetHeight && vmodel.arrClass == "bottom") {
                            vmodel.arrClass = "top"
                            tipElem.removeClass("oni-tooltip-bottom").addClass("oni-tooltip-top")
                        } else if(tipElem.position().top + tooltipElem.offsetHeight < atEle.position().top && vmodel.arrClass == "top") {
                            vmodel.arrClass = "bottom"
                            tipElem.removeClass("oni-tooltip-top").addClass("oni-tooltip-bottom")
                        }

                        // 根据元素和tooltip元素的宽高调整箭头位置
                        if(arrOut && arrIn) {
                            var dir = vmodel.arrClass == "bottom" || vmodel.arrClass == "left",
                                avalonElem = avalon(elem),
                                moveToLeft = tipElem.position().left + tooltipElem.offsetWidth / 2 > avalonElem.position().left + elem.offsetWidth,
                                moveToRight = tipElem.position().left + tooltipElem.offsetWidth / 2 < avalonElem.position().left
                            // tip元素中线偏出elem
                            if((vmodel.arrClass == "top" || vmodel.arrClass == "bottom") && ( moveToRight || moveToLeft)) {
                                arrOut.position({
                                    of: tooltipElem, 
                                    at: (moveToRight ? "right" : "left") + " " + (dir ? "bottom" : "top"), 
                                    my: (moveToRight ? "right-10" : "left+10") + " " + (dir ? "top" : "bottom"), 
                                    within: document.body
                                })
                                arrIn.position({
                                    of: tooltipElem, 
                                    at: (moveToRight ? "right" : "left") + " " + (dir ? "bottom" : "top"), 
                                    my: (moveToRight ? "right-11" : "left+11") + " " + (dir ? "top-" : "bottom+") + lessH/2, 
                                    within: document.body
                                })
                            // 竖直方向，高度不够  
                            } else if((vmodel.arrClass == "bottom" || vmodel.arrClass == "top") && tooltipElem.offsetWidth < elem.offsetWidth) {
                                arrOut.position({
                                    of: tooltipElem, 
                                    at: "center " + (dir ? "bottom" : "top"), 
                                    my: "center " + (dir ? "top" : "bottom"), 
                                    within: document.body
                                })
                                arrIn.position({
                                    of: tooltipElem, 
                                    at: "center " + (dir ? "bottom" : "top"), 
                                    my: "center " + (dir ? "top-" : "bottom+") + lessH, 
                                    within: document.body
                                })
                            // 水平方向，宽度不够
                            } else if((vmodel.arrClass == "left" || vmodel.arrClass == "right") && tooltipElem.offsetHeight < elem.offsetHeight) {
                                 arrOut.position({
                                    of: tooltipElem, 
                                    at: (dir ? "left" : "right") + " center", 
                                    my: (dir ? "right" : "left") + " center", 
                                    within: document.body
                                })
                                arrIn.position({
                                    of: tooltipElem, 
                                    at: (dir ? "left" : "right") + " center", 
                                    my: (dir ? "right+" : "left-") + lessW  + " center", 
                                    within: document.body
                                })
                            } else {
                                // vvvvvvvvvvvvvvvvvvvvvvvvvvvvv
                                var tipPos = tipElem.offset(),
                                    elemPos = avalon(elem).offset(),
                                    elemH = elem.offsetHeight,
                                    elemW = elem.offsetWidth,
                                    oleft
                                switch(vmodel.arrClass) {
                                    case "left":
                                    case "right":
                                        if(vmodel.arrClass == "left") {
                                            arrOut[0].style.left = "-6px"
                                            arrIn[0].style.left = "-5px"
                                        } else {
                                            arrOut[0].style.right = "-5px"
                                            arrIn[0].style.right = "-4px"
                                        }
                                        oleft = (Math.floor(elemH / 2) - tipPos.top + elemPos.top)
                                        arrOut[0].style.top = oleft + "px"
                                        arrIn[0].style.top = (oleft + 1) + "px"
                                        break
                                    case "top":
                                    case "bottom":
                                    default:
                                        if(vmodel.arrClass == "top") {
                                            arrOut[0].style.top = "-6px"
                                            arrIn[0].style.top = "-5px"
                                        } else {
                                            arrOut[0].style.top = arrIn[0].style.top = "auto"
                                            arrOut[0].style.bottom = "-6px"
                                            arrIn[0].style.bottom = "-5px"
                                        }
                                        oleft = (Math.floor(elemW / 2) - tipPos.left + elemPos.left)
                                        arrOut[0].style.left = oleft + "px"
                                        arrIn[0].style.left = (oleft + 1) + "px"
                                }
                            }
                        }
                    }
                }
                // IE里面透明箭头显示有问题，屏蔽掉
                if(vmodel.animated && !!-[1,]) {
                    clearInterval(animateTimer)
                    var now = (avalon(tooltipElem).css("opacity") * 100) >> 0,
                    dis = vmodel._animateArrMaker(now, 100)
                    avalon(tooltipElem).css("opacity", dis[0] / 100)
                    dis.splice(0, 1)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            return clearInterval(animateTimer)
                        }
                        avalon(tooltipElem).css("opacity",  dis[0] / 100)
                        dis.splice(0, 1) 
                    }, 50)
                }
            }
            //@interface hide($event) 隐藏tooltip，参数是$event，可缺省
            vm.hide = function(e) {
                e && e.preventDefault && e.preventDefault()
                vmodel.toggle = false
            }
            vm._hide = function(e) {
                if(!tooltipElem) return
                if(vmodel.animated && !!-[1,]) {
                    clearInterval(animateTimer)
                    var now = (avalon(tooltipElem).css("opacity") * 100) >> 0,
                    dis = vmodel._animateArrMaker(now, 0)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            tooltipElem.style.display = "none"
                            avalon(tooltipElem).addClass("oni-tooltip-hidden")
                            return clearInterval(animateTimer)
                        }
                        avalon(tooltipElem).css("opacity",  dis[0]/100)
                        dis.splice(0, 1) 
                    }, 50)
                } else {
                    tooltipElem.style.display = "none"
                }
            }
            // 为了实现通过toggle属性控制显示隐藏
            vm.__hide = function() {
                if(vmodel.toggle) {
                    vmodel.toggle = false
                } else {
                    vmodel._hide()
                }
            }
            vm.__show = function(event, force) {
                if(event) {
                    _event_ele = this
                    _event = event
                }
                if(vmodel._isShown() || vmodel.toggle) {
                    vmodel._show(_event)
                } else {
                    vmodel.toggle = true
                }
            }
            vm._show = function(e, content) {
                var tar =  _event_ele || vmodel.widgetElement
                    , src = e && (e.srcElement || e.target) || ofElement || vmodel.widgetElement
                    , content = content
                // delegate情形下，从src->this找到符合要求的元素
                if(content === void 0) {
                    if(vmodel.delegate) {
                        content = vmodel.contentGetter.call(vmodel, src)
                        while(!content && src && src != tar) {
                            src = src.parentNode
                            content = vmodel.contentGetter.call(vmodel, src)
                        }
                        tar = src
                    } else {
                        content = vmodel.contentGetter.call(vmodel, tar)
                    }
                } else {
                    tar = src
                }
                if(content == void 0) {
                    _event = ofElement
                    return
                }
                clearTimeout(hideTimer)
                clearTimeout(animateTimer)
                var inited = tar.getAttribute("oni-tooltip-inited")
                // 禁用默认的title
                var oldTitle = tar.title
                vmodel.content = content
                if(tar.title) tar.title = ""
                if(!tooltipElem) {
                    tooltipElem = tooltipELementMaker()
                    avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                }
                avalon(tooltipElem).removeClass("oni-tooltip-hidden")
                // 减少抖动
                if(!vmodel.track) {
                    _init(vmodel.arrClass)
                }
                vmodel.show(vmodel.track ? e || tar : tar)
                var inited = tar.getAttribute("oni-tooltip-inited")
                if(!inited) {
                    tar.setAttribute("oni-tooltip-inited", 1)
                    // 自动隐藏
                    vmodel.autohide && avalon(tar).bind(vmodel.event != "focus" ? "mouseleave" : "blur", function(e) {
                        if(oldTitle) tar.title = oldTitle
                        clearTimeout(hideTimer)
                        if(vmodel.autohide) hideTimer = setTimeout(vmodel.__hide, vmodel.hiddenDelay)
                    })
                    // 鼠标跟随
                    if(vmodel.track && (vmodel.event == "mouseover" || vmodel.event == "mouseenter")) {
                        avalon(tar).bind("mousemove", function(e) {
                            _track_event = e
                            vmodel.show(e)
                            // 减少抖动
                            avalon(tooltipElem).removeClass("oni-tooltip-hidden")
                        })
                    }
                }
            }
            //@interface showBy($event, content) 参数满足 {target: elem}这样，或者是一个elem元素亦可，tooltip会按照elem定位，并作为参数传递给contentGetter，如果指定content，则忽略contentGetter的返回，直接显示content内容
            vm.showBy = function(obj, content) {
                vmodel._show(obj && obj.tagName ? {target: obj} : obj, content)
            }
            vm._isShown = function() {
                var elem = avalon(tooltipElem)
                return elem.css("display") != "none" && !elem.hasClass("oni-tooltip-hidden")
            }

        })
      
      
        function tooltipELementMaker() {
            var f = avalon.parseHTML(vmodel.template)
            var tooltipElem = f.childNodes[0]
            document.body.appendChild(f)
            return tooltipElem
        }
        vmodel.$watch("position", function(newValue) {
            _init(vmodel.position)
            vmodel._isShown() && vmodel.show()
        })

        vmodel.$watch("positionAt", function(newValue) {
            customAt = newValue
            _init(vmodel.position)
            vmodel._isShown() && vmodel.show()
        })

        vmodel.$watch("positionMy", function(newValue) {
            customMy = newValue
            _init(vmodel.position)
            vmodel._isShown() && vmodel.show()
        })

        vmodel.$watch("toggle", function(n) {
            if(n) {
                vmodel._show(vmodel.track && _track_event || _event)
            } else {
                vmodel._hide()
            }
        })

        return vmodel
    }

    widget.defaults = {
        toggle: false, //@config 组件是否显示，可以通过设置为false来隐藏组件
        collision: "none",//@config 溢出检测，当被定位元素在某些方向上溢出窗口，则移动它到另一个位置。与 my 和 at 选项相似，该选项会接受一个单一的值或一对 horizontal/vertical 值。例如：flip、fit、fit flip、fit none。/nflip：翻转元素到目标的相对一边，再次运行 collision 检测一遍查看元素是否适合。无论哪一边允许更多的元素可见，则使用那一边。/nfit：把元素从窗口的边缘移开。/nflipfit：首先应用 flip 逻辑，把元素放置在允许更多元素可见的那一边。然后应用 fit 逻辑，确保尽可能多的元素可见。/nnone: 不检测
        event: "mouseenter",  //@config 显示tooltip的事件，默认hover的时候显示tooltip，为false的时候就不绑定事件，如果后面设置了自动隐藏，则mouseenter对应的是mouseleave,focus对应的是blur，进行自动隐藏事件侦听，使用代理的时候，目测不支持focus,blur，event可以配置为空，则不会添加事件侦听
        //content: ,        /\/\@config tooltip显示内容，默认去获取element的title属性
        width: "auto",        //@config tip宽度，默认是auto
        height: "auto",       //@config tip高度，默认是auto    
        arrow: true,          //@config 是否显示尖角图标，默认为true
        autohide: true,       //@config 元素hoverout之后，是否自动隐藏tooltip，默认true
        delegate: false,      //@config 元素是否只作为一个代理元素，这样适合对元素内多个子元素进行tooltip绑定
        disabled: false,      //@config 禁用
        track: false,         //@config tooltip是否跟随鼠标，默认否
        animated: true,         //@config 是否开启显示隐藏切换动画效果
        position: "rt",      //@config tooltip相对于element的位置，like: rt,rb,rc...
        positionMy: false,    //@config tooltip元素的定位点，like: left top+11
        positionAt: false,    //@config element元素的定位点，like: left top+11,positionAt && positionMy时候忽略position设置
        hiddenDelay: 64,    //@config tooltip自动隐藏时间，单位ms
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        "contentGetter": function(elem) {
            if(elem.tagName.toLowerCase() != "a") return
            return elem.title
        }, //@config contentGetter() 获取内容接口，讲srcElement作为参数传递过来，默认是返回a标签的title，如果该函数返回为空，那么则不会显示tooltip
        //@config _animateArrMaker(from, to) 不支持css3动画效果步长生成器函数，返回一个数组，类似[0,xx,xx,xx,50]
        _animateArrMaker: function(from, to) {
            var arr = []
                , dis = to - from
                , d = dis > 0 ? 10 : -10
            while(from != to) {
                from += d
                from = from > 100 ? 100 : from
                dis = parseInt(dis - d)
                if(Math.abs(dis) <= 1) from = to
                arr.push(from)
            }
            if(!arr.length) arr = [to]
            return arr
        },
        getTemplate: function(tmpl, opts) {
            return tmpl
        }, //@config getTemplate(tpl, opts) 定制修改模板接口
        $author: "skipper@123"
    }
})