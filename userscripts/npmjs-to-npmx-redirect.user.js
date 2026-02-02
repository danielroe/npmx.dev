// ==UserScript==
// @name       npmjs.com to npmx.dev Redirect
// @namespace  https://github.com/npmx-dev
// @version    1.0
//
// @description     Redirect npmjs.com URLs to the npmx.dev equivalent (simple hostname swap)
// @description:ar  إعادة توجيه عناوين npmjs.com إلى ما يعادلها على npmx.dev (استبدال اسم المضيف ببساطة)
// @description:de  Weiterleitung von npmjs.com URLs zur npmx.dev-Entsprechung (einfache Hostnamenänderung)
// @description:en  Redirect npmjs.com URLs to the npmx.dev equivalent (simple hostname swap)
// @description:es  Redirigir URLs de npmjs.com al equivalente en npmx.dev (cambio simple de host)
// @description:fr  Rediriger les URL npmjs.com vers leur équivalent npmx.dev (simple remplacement d’hôte)
// @description:hi  npmjs.com URL को npmx.dev समकक्ष पर रीडायरेक्ट करें (सरल होस्टनाम स्वैप)
// @description:it  Reindirizza gli URL di npmjs.com all’equivalente npmx.dev (semplice sostituzione host)
// @description:ja  npmjs.com の URL を npmx.dev の同等ページにリダイレクト（シンプルなホスト名置換）
// @description:ko  npmjs.com URL을 npmx.dev 대응 URL로 리디렉션 (간단한 호스트 이름 변경)
// @description:pt  Redirecionar URLs npmjs.com para o equivalente npmx.dev (simples troca de host)
// @description:ru  Перенаправляет URL с npmjs.com на эквивалентные страницы npmx.dev (простая замена хоста)
// @description:uk  Перенаправляє URL з npmjs.com на еквівалентні сторінки npmx.dev (проста заміна хоста)
//
// @iconURL  https://npmx.dev/favicon.ico
// @author   Okinea Dev
//
// @include  /^https?:\/\/(?:www\.)?npmjs\.com\/(?:(?:package/|org/|search\?q=|~).*)$/
// @run-at   document-start
// @tag      npm
// @tag      npmjs
//
// @grant none
// ==/UserScript==

(function() {
    location.host = 'npmx.dev'
})()
