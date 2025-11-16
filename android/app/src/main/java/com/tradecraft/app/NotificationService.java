package com.tradecraft.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class NotificationService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        String channelId = getString(R.string.default_notification_channel_id);
        ensureChannel(channelId);
        String title = remoteMessage.getNotification() != null ? remoteMessage.getNotification().getTitle() : null;
        String body = remoteMessage.getNotification() != null ? remoteMessage.getNotification().getBody() : null;
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.drawable.ic_notification)
                .setColor(ContextCompat.getColor(this, R.color.notification_color))
                .setAutoCancel(true);
        if (title != null) builder.setContentTitle(title);
        if (body != null) builder.setContentText(body);
        Bitmap large = appIconBitmap();
        if (large != null) builder.setLargeIcon(large);
        NotificationManagerCompat.from(this).notify((int) System.currentTimeMillis(), builder.build());
    }

    private void ensureChannel(String channelId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm.getNotificationChannel(channelId) == null) {
                NotificationChannel ch = new NotificationChannel(channelId, "General", NotificationManager.IMPORTANCE_DEFAULT);
                nm.createNotificationChannel(ch);
            }
        }
    }

    private Bitmap appIconBitmap() {
        Drawable d = getResources().getDrawable(R.mipmap.ic_launcher, null);
        int w = getResources().getDimensionPixelSize(android.R.dimen.notification_large_icon_width);
        int h = getResources().getDimensionPixelSize(android.R.dimen.notification_large_icon_height);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && d instanceof AdaptiveIconDrawable) {
            AdaptiveIconDrawable ad = (AdaptiveIconDrawable) d;
            LayerDrawable ld = new LayerDrawable(new Drawable[]{ad.getBackground(), ad.getForeground()});
            Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            ld.setBounds(0, 0, w, h);
            ld.draw(c);
            return b;
        }
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, w, h);
        d.draw(c);
        return b;
    }
}