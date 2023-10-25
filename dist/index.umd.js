!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("nanoid"),require("cookie-signature"),require("next/headers"),require("next/dist/compiled/@edge-runtime/cookies"),require("util")):"function"==typeof define&&define.amd?define(["exports","nanoid","cookie-signature","next/headers","next/dist/compiled/@edge-runtime/cookies","util"],t):t((e||self).nextAppSession={},e.nanoid,e.cookieSignature,e.headers,e.cookies,e.util)}(this,function(e,t,i,n,r,o){function s(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var u=/*#__PURE__*/s(i);function c(){return c=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var i=arguments[t];for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n])}return e},c.apply(this,arguments)}var l=/*#__PURE__*/function(){function e(){return this.store=void 0,this._instance=void 0,this._instance?this._instance:"undefined"!=typeof global&&global.sessionMemoryStore?global.sessionMemoryStore:(this.store=new Map,this._instance=this,"undefined"!=typeof global&&(global.sessionMemoryStore=this),this)}var t=e.prototype;return t.get=function(e){try{var t,i=this,n=i.store.get(e),r=function(){if(n){var r=function(e){return t?e:(t=1,o)},o=JSON.parse(n,function(e,t){return"expires"===e?new Date(t):t}),s=function(n){if(null!=(n=o.cookie)&&n.expires&&o.cookie.expires.getTime()<=Date.now())return Promise.resolve(i.destroy(e)).then(function(){return t=1,null})}();return s&&s.then?s.then(r):r(s)}}();return Promise.resolve(r&&r.then?r.then(function(e){return t?e:null}):t?r:null)}catch(e){return Promise.reject(e)}},t.set=function(e,t){try{return this.store.set(e,JSON.stringify(t)),Promise.resolve()}catch(e){return Promise.reject(e)}},t.destroy=function(e){try{return this.store.delete(e),Promise.resolve()}catch(e){return Promise.reject(e)}},t.touch=function(e,t){try{return this.store.set(e,JSON.stringify(t)),Promise.resolve()}catch(e){return Promise.reject(e)}},e}(),h=/*#__PURE__*/function(){function e(e,i,n){if(this.req=void 0,this.store=void 0,this.sid=void 0,this.name=void 0,this.secret=void 0,this.genid=void 0,this.cookieOpts=void 0,this.touchAfter=void 0,!n&&"undefined"!=typeof window)throw new Error("Wrong implementation, please check the next-app-session docs for more info");return this.req=n,this.store=e,this.name=(null==i?void 0:i.name)||"sid",this.secret=null==i?void 0:i.secret,this.genid=(null==i?void 0:i.genid)||t.nanoid,this.cookieOpts=null==i?void 0:i.cookie,this.touchAfter=null==i?void 0:i.touchAfter,this}var i=e.prototype;return i.getCookie=function(e){var t,i;return null!=(t=this.req)&&t.cookies?this.req.cookies[e]:null==(i=n.cookies().get(e))?void 0:i.value},i.setCookie=function(e,t,i){var o;if(null!=(o=this.req)&&o.headers){var s=new Headers(this.req.headers);new r.RequestCookies(s).set(e,t)}return n.cookies().set(e,t,i)},i._getID=function(){return this.decode(this.getCookie(this.name))},i._initID=function(){var e=this._getID();!e&&this.genid&&(e=this.genid()),this.sid=e||""},i.encode=function(e){return this.secret&&""!=this.secret?e?"s:"+u.default.sign(e,this.secret||""):"":e},i.decode=function(e){return e&&this.secret&&""!=this.secret?u.default.unsign(e.slice(2),this.secret||"")||null:e||null},i.all=function(){try{var e,t=this;return t._initID(),Promise.resolve(null==(e=t.store)?void 0:e.get(t.sid)).then(function(e){return null!=e?e:{}})}catch(e){return Promise.reject(e)}},i.get=function(e){try{return Promise.resolve(this.all()).then(function(t){var i;return null!=(i=null==t?void 0:t[e])?i:null})}catch(e){return Promise.reject(e)}},i.has=function(e){try{return Promise.resolve(this.all()).then(function(t){return!(null==t||!t[e])&&""!==(null==t?void 0:t[e])})}catch(e){return Promise.reject(e)}},i.set=function(e,t){try{var i=this;return Promise.resolve(i.all()).then(function(n){return n||(n={}),n[e]=t,Promise.resolve(i.setAll(n)).then(function(){})})}catch(e){return Promise.reject(e)}},i.setAll=function(e){try{var t=function(){return Promise.resolve(i.store.set(i.sid,c({},e))).then(function(){})},i=this;i._initID();var n=i._getID(),r=function(){var e,t,r,o,s,u,c,l;if(!n||""==n)return Promise.resolve(i.setCookie(i.name,i.encode(i.sid),{path:(null==(e=i.cookieOpts)?void 0:e.path)||"/",httpOnly:null==(t=null==(r=i.cookieOpts)?void 0:r.httpOnly)||t,domain:(null==(o=i.cookieOpts)?void 0:o.domain)||void 0,sameSite:null==(s=i.cookieOpts)?void 0:s.sameSite,secure:(null==(u=i.cookieOpts)?void 0:u.secure)||!1,maxAge:(null==(c=i.cookieOpts)?void 0:c.maxAge)||void 0,expires:(null==(l=i.cookieOpts)?void 0:l.expires)||void 0})).then(function(){})}();return Promise.resolve(r&&r.then?r.then(t):t())}catch(e){return Promise.reject(e)}},i.destroy=function(e){try{var t=this,i=e?Promise.resolve(t.all()).then(function(i){return delete i[e],Promise.resolve(t.setAll(i)).then(function(){})}):Promise.resolve(t.setAll({})).then(function(){});return Promise.resolve(i&&i.then?i.then(function(){}):void 0)}catch(e){return Promise.reject(e)}},e}();h.instance=void 0,e.AppSession=h,e.MemoryStore=l,e.default=function(e){var t=e.store||new l;return function(i){return new h(t,e,i)}},e.promisifyStore=function(e){return c({get:o.promisify(e.get).bind(e),set:o.promisify(e.set).bind(e),destroy:o.promisify(e.destroy).bind(e)},e.touch&&{touch:o.promisify(e.touch).bind(e)})}});
//# sourceMappingURL=index.umd.js.map
