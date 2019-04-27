package com.auraltrainer;

import android.media.MediaPlayer;
import android.media.VolumeShaper;
import android.media.VolumeShaper.Configuration;
import android.media.VolumeShaper.Configuration.Builder;
import android.net.Uri;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.IOException;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

class PlayerInfo {
  public MediaPlayer player;
  private String key;

  PlayerInfo(MediaPlayer player, String key) {
    this.player = player;
    this.key = key;
  }

  public String key() { return this.key; }
}

public class MyAudioModule extends ReactContextBaseJavaModule {
  private final HashMap<String, PlayerInfo> playerPool = new HashMap<String, PlayerInfo>();
  private final ReactApplicationContext context;
  private AtomicInteger counter = new AtomicInteger();

  public MyAudioModule(ReactApplicationContext reactContext) {
    super(reactContext);

    this.context = reactContext;
  }

  @Override
  public String getName() {
    return "NativeAudioManager";
  }

  @ReactMethod
  public void prepare(String path, Promise promise) {
      String key = path + ":" + counter.incrementAndGet(); // TODO: Proper key object
    PlayerInfo player = new PlayerInfo(new MediaPlayer(), key);

    int resId = this.context.getResources().getIdentifier(path,
            "raw", this.context.getPackageName());
    String resourcePath = "android.resource://" + this.context.getPackageName() + "/" + resId;
    if (resId == 0) {
      promise.reject("E_NO_RESOURCE", "Resource not found: " + resourcePath);
      return;
    }

    player.player.setOnErrorListener(new MediaPlayer.OnErrorListener() {
      @Override
      public boolean onError(MediaPlayer mp, int what, int extra) {
        promise.reject("E_PREPARE_FAILED", "Prepare failed: " + what + ", " + extra);
        return true;
      }
    });
    player.player.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
      @Override
      public void onPrepared(MediaPlayer player) {
        promise.resolve(null);
        // TODO: Need a more generic way to handle async errors, since they could happen in playback!
        player.setOnErrorListener(null);
      }
    });

    try {
      player.player.setDataSource(this.context, Uri.parse(resourcePath));
    } catch (IOException e) {
      promise.reject("E_INVALID_RESOURCE", "Resource not found: " + resourcePath, e);
      return;
    }
    this.playerPool.put(player.key(), player);
    try {
      player.player.prepare();
    } catch (IOException e) {
      e.printStackTrace();
      promise.reject("E_PREPARE_FAILED", "prepare failed", e);
      return;
    }
    promise.resolve(player.key());
  }

  @ReactMethod
  public void play(String path, Promise promise) {
    PlayerInfo player = this.playerPool.get(path);
    if (player == null) {
      promise.reject("E_NOT_PREPARED", "Player has not been prepared!");
      return;
    }

    try {
      player.player.start();
    } catch (IllegalStateException e) {
      promise.reject("E_INVALID_STATE", "Internal player was in invalid state for play()", e);
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void stopAndReset(String path, Promise promise) {
    PlayerInfo player = this.playerPool.get(path);
    if (player == null) {
      promise.reject("E_STOP_NOT_PREPARED", "Player has not been prepared!");
      return;
    }

      Configuration config = new Builder()
              .setDuration(200)
              .setCurve(new float[] {0.f, 1.f}, new float[] {0.f, 0.f})
              .setInterpolatorType(Configuration.INTERPOLATOR_TYPE_LINEAR)
              .build();

    VolumeShaper shaper = player.player.createVolumeShaper(config);
    shaper.apply(VolumeShaper.Operation.PLAY);
    new android.os.Handler().postDelayed(() -> {
        player.player.stop();
        promise.resolve(null);
    }, 200);
  }

  @ReactMethod
  public void destroy(String path, Promise promise) {
    PlayerInfo player = this.playerPool.get(path);
    if (player == null) {
      promise.reject("E_NOT_PREPARED", "Player has not been prepared!");
      return;
    }

    player.player.release();

    this.playerPool.remove(path);
    promise.resolve(null);
  }
}
