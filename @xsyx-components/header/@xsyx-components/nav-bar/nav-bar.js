// components/nav-bar/nav-bar.js
import {
    getCurrentPageUrl
} from '../../utils/util.js';
import event, {
    EVENTS
} from '../../utils/events.js';
const cartService = require('../../utils/cartService.js');
const app = getApp();

//创建节点选择器
// var query = wx.createSelectorQuery();
// const { windowWidth, windowHeight} = wx.getSystemInfoSync();
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        channel: {
            type: String,
            value: 'home',
        },
        showBrand: {
            type: Boolean,
            value: false,
        },
        mode: {
            type: String,
            value: "normal", // normal ghost
        },
        // 页面是否可见
        isShowPage: {
            type: Boolean,
            value: true
        },
        /*
            必传字段
            为0取默认的
         */
        areaId: {
            type: Number,
            value: 0,
            observer(newVal, oldVal, changedPath) {
                //this.areaIdObserver(newVal, oldVal, changedPath);
            }
        },
        /**
         * 在ghost导航模式下是否显示去首页的按钮。
         */
        ghostIsShowHome: {
            value: true,
            type: Boolean
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        cartCount: 0,
        channel: 'home',
        iphonex: false,
        hasNewBrand: false,
        navBar: [],
        isShow: false,
        defaultNavbar: {
            home: {
                navName: "首页",
                unSelectUrl: "static/home.png",
                selectedUrl: "static/home-select.png",
                defUnSUrl: "static/home.png",
                defSUrl: "static/home-select.png",
                isIconGif: false
            },
            brand: {
                navName: "生鲜馆",
                unSelectUrl: "static/df.gif",
                selectedUrl: "static/df.png",
                defUnSUrl: "static/df.gif",
                defSUrl: "static/df.png",
                isIconGif: true
            },
            cart: {
                navName: "购物车",
                unSelectUrl: "static/cart.png",
                selectedUrl: "static/cart-select.png",
                defUnSUrl: "static/cart.png",
                defSUrl: "static/cart-select.png",
                isIconGif: false
            },
            center: {
                navName: "我的",
                unSelectUrl: "static/center.png",
                selectedUrl: "static/center-select.png",
                defUnSUrl: "static/center.png",
                defSUrl: "static/center-select.png",
                isIconGif: false
            },
            bgUrl: ""
        },
        // 底部高度
        bottomBlankHeignt: app.globalData.isIPhoneX ? 68 : 0
        // isShowBrand:false,//生鲜馆显示
    },
    //onshow
    ready: function() {
        if (wx.getSystemInfoSync().model.indexOf("iPhone X") != -1) {
            this.setData({
                iphonex: true
            })
        }
        var areaId = this.data.areaId > 0 ? this.data.areaId : (app.frxs.getMOrSData("areaId") || 0);

        this.getNavbar(areaId);
    },
    attached() {
        var cartNum = cartService.getCartNum();
        this.setData({
            cartCount: cartNum,
            hasNewBrand: this.data.channel !== 'brand'
        });
        this.setTabBarBadge(cartNum);
        // 添加购物车
        event.on(EVENTS.ADD_CART, (product, e) => {
            this.setData({
                //cartCount: app.globalData.countCart()
                cartCount: cartService.getCartNum()
            })
        })

        // 从缓存重新更新购物车
        event.on(EVENTS.REFRESH_CART, this.updateCartNum, this)
        event.on("NAV_BAR_UPDATE",this.updateNavBar, this);
    },
    detached() {
        event.remove(EVENTS.ADD_CART);
        event.remove(EVENTS.REFRESH_CART, this.updateCartNum, this);
        event.remove("NAV_BAR_UPDATE_" + this.data.channel);
        event.remove("NAV_BAR_UPDATE", this.updateNavBar);
    },

    /**
     * 组件的方法列表
     */
    methods: {
        updateCartNum(product){
            var cartNum = cartService.getCartNum();
            this.setData({
                cartCount: cartNum
            });
            this.setTabBarBadge(cartNum);
        },
        //去首页
        goIndex: function() {
            if (this.data.channel == "home") {
                return;
            }
            app.userSvr.navigateToAndBack({
                path: "/pages/home/index/index"
            });
        },
        //去生鲜馆
        goBrand: function() {
            if (this.data.channel == "brand") {
                return;
            }
            app.userSvr.navigateToAndBack({
                path: '/pages/brand/index/index'
            });
        },
        //去购物车
        goCart: function() {
            if (this.data.channel == "cart") {
                return;
            }
            var that = this;
            var thatPage = getCurrentPages()[getCurrentPages().length - 1];
            thatPage.setData({
                loginSuccessToPage: "cart"
            });
            app.userSvr.navigateTo({
                path: '/pages/home/cart/cart',
                // 当未登录时显示获取微信绑定的手机号码登录提示框。
                showGetPhoneNumber: function() {
                    if (app.frxs.compareVersion("1.2.0") == -1) {
                        app.userSvr.navigateTo({
                            path: "/pages/users/loginstep2/loginstep2"
                        });
                    } else {
                        thatPage.setData({
                            isShowGetPhoneNumber: true,
                            loginSuccessToPage: "cart"
                        });
                    }
                }
            })
        },
        //去个人中心
        goCenter: function() {
            if (this.data.channel == "center") {
                return;
            }
            var that = this;
            var thatPage = getCurrentPages()[getCurrentPages().length - 1];
            thatPage.setData({
                loginSuccessToPage: "center"
            });
            app.userSvr.navigateTo({
                path: '/pages/users/center/center',
                // 当未登录时显示获取微信绑定的手机号码登录提示框。
                showGetPhoneNumber: function() {
                    if (app.frxs.compareVersion("1.2.0") == -1) {
                        app.userSvr.navigateTo({
                            path: "/pages/users/loginstep2/loginstep2"
                        });
                    } else {
                        thatPage.setData({
                            isShowGetPhoneNumber: true,
                            loginSuccessToPage: "center"
                        });
                    }
                }
            });
        },
        areaIdObserver(newVal, oldVal, changedPath) {
            if (newVal != oldVal) {
                this.getNavbar(newVal);
            }
        },
        // 获取底部导航数据
        getNavbar(areaId) {
            var navbarData = this.getClientValidNavbar(areaId);
            var storeId = wx.getStorageSync("storeId");

            if (navbarData) {
                this.renderData(navbarData);
                return
            }

            if (!storeId) {
                this.renderData(this.data.defaultNavbar);
                return;
            }

            var that = this;

            var params = {
                areaId: areaId || this.data.areaId,
                storeId: storeId
            };
            app.frxs.ajax({
                url: "/promotion/user/navigation/queryFootNav",
                isShowErrMsg: false,
                data: params,
                success: function(res) {
                    that.jxNavbarData(res,areaId);
                },
                fail: function(res) {
                    that.renderData(that.getClientNavbar(areaId));
                }
            });
        },
        // 从客户端获取底部导航缓存数据
        getClientNavbar(areaId) {
            var navbarDataKey = app.frxs.constDefinition.storageKey.NAVBARDATA + areaId;
            var navbarData = app.frxs.getMOrSData(navbarDataKey);

            if (navbarData && navbarData.data) {
                navbarData.data.bgUrl = "";
                return navbarData.data;
            } else {
                return this.data.defaultNavbar;
            }
        },
        // 从客户端获取有效的底部导航缓存数据
        getClientValidNavbar(areaId) {
            if (!areaId) {
                // 当未取到区域时直接取默认导航信息
                return this.data.defaultNavbar;
            }
            var navbarDataKey = app.frxs.constDefinition.storageKey.NAVBARDATA + areaId;
            var navbarData = app.frxs.getMOrSData(navbarDataKey);

            if (!navbarData || !navbarData.dtime) {
                return null;
            }

            var curDtime = new Date();
            var curDate = app.frxs.formaterDate(curDtime, 'yyyy-MM-dd ');
            // 每天更新的时间点，从大到小
            //var updateTime = ["00:00:00", "00:30:00", "09:30:00", "23:30:00"];
            var updateTime = ["00:00:00", "00:30:00", "09:30:00", "23:30:00"];

            //debugger 调试代码，上线前会删除
            //updateTime.push(app.frxs.formaterDate(navbarData.dtime + (1000 * 60 *15), "HH:mm:ss"));

            var preUpdateTime = navbarData.dtime > 0 ? navbarData.dtime : 0;
            const needUpdate = updateTime.some((it) => {
                var _updateTime = +app.frxs.strToDate(curDate + it);
                if (+curDtime > _updateTime && _updateTime > preUpdateTime) {
                    return true;
                }
            })

            return !needUpdate ? navbarData.data || this.data.defaultNavbar : null;
        },
        jxNavbarData(res, areaId) {
            var that = this;
            var navData = this.getClientNavbar(areaId);

            if ((res || {}).rspCode == "success") {
                var navbarDataKey = app.frxs.constDefinition.storageKey.NAVBARDATA + areaId;
                var navItem = (res.data || {}).navItem;
                if (navItem && navItem.length > 0) {
                    navData.home = app.frxs.extend(navData.home, res.data.navItem.find((item) => {
                        return item.navCode == "CHOICE";
                    }) || {});

                    navData.brand = app.frxs.extend(navData.brand, res.data.navItem.find((item) => {
                        return item.navCode == "BRAND_HOUSE";
                    }) || {});

                    navData.cart = app.frxs.extend(navData.cart, res.data.navItem.find((item) => {
                        return item.navCode == "SHOP_CAR";
                    }) || {});

                    navData.center = app.frxs.extend(navData.center, res.data.navItem.find((item) => {
                        return item.navCode == "MY";
                    }) || {});

                    navData.bgUrl = res.data.backgroundUrl || "";
                    // 保存至缓存中的数据
                    var navbarData = {
                        // 获取保存时间
                        dtime: +(new Date()),
                        // 导航数据
                        data: navData
                    };
                    app.frxs.setMAndSData(navbarDataKey, navbarData);

                    event.emit("NAV_BAR_UPDATE", navbarData.data);
                } else {
                    // 保存至缓存中的数据
                    var navbarData = {
                        // 获取保存时间
                        dtime: +(new Date()),
                        // 导航数据
                        data: navData
                    };
                    app.frxs.setMAndSData(navbarDataKey, navbarData);
                }
            }
            this.renderData(navData);
        },
        // 渲染数据
        renderData(data) {
            for (var item in data) {
                if (data[item].unSelectUrl) {
                    var unSelectUrl = data[item].unSelectUrl;
                    data[item].isIconGif = unSelectUrl.substring(unSelectUrl.lastIndexOf(".") + 1) == "gif";
                }
            }
            this.setData({
                isShow: true,
                navBar: data
            })
        },
      updateNavBar(data){
        if (!this.data.isShowPage) {
          this.renderData(data);
        }
      },
        // 图片加载失败后加载默认的图片
        imgError(e) {
            var dataset = e.currentTarget.dataset;
            var imgNode = dataset.imgnode;
            var errorUrl = dataset.errorurl;
            if (errorUrl) {
                this.setData({
                    ["navBar." + imgNode]: errorUrl
                });
            }
        },
        /**
         * 设置小程序自带的购物车角标
         * @param {} cartNum 
         */
        setTabBarBadge(cartNum) {
            if (typeof wx.setTabBarBadge == "function") {
                wx.setTabBarBadge({
                    index: 2,
                    text: (cartNum || 0).toString()
                })
            }
        }
    }
})
