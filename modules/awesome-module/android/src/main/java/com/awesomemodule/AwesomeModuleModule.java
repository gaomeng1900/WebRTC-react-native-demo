package com.awesomemodule;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = AwesomeModuleModule.NAME)
public class AwesomeModuleModule extends ReactContextBaseJavaModule {
  public static final String NAME = "AwesomeModule";
  public static final Runtime rt = Runtime.getRuntime();

  public AwesomeModuleModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  public void multiply(double a, double b, Promise promise) {
    promise.resolve(a * b);
  }

  @ReactMethod
  public void shell(String cmd, Promise promise) {
    try {
      Process process = rt.exec(cmd);
      // promise.resolve(process.waitFor());

      // Process p = new ProcessBuilder(cmd.split("\\s+")).start();

      promise.resolve(0);
    } catch (Exception e) {
      promise.reject("ERR", e);
    }
  }
}
