package com.tradecraft.app;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @SuppressLint("SetJavaScriptEnabled")
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView webView = getBridge().getWebView();
    WebSettings webSettings = webView.getSettings();
    webSettings.setDatabaseEnabled(true);
    webSettings.setDomStorageEnabled(true);
    webSettings.setJavaScriptEnabled(true);
    webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
    webSettings.setSaveFormData(true);
    webSettings.setAllowFileAccess(true);
    webSettings.setAllowContentAccess(true);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    }

    CookieManager cookieManager = CookieManager.getInstance();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      CookieSyncManager.createInstance(this);
    }
    cookieManager.setAcceptCookie(true);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      cookieManager.setAcceptThirdPartyCookies(webView, true);
    }
  }

  @Override
  public void onStop() {
    super.onStop();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      CookieManager.getInstance().flush();
    } else {
      CookieSyncManager.getInstance().sync();
    }
  }
}
