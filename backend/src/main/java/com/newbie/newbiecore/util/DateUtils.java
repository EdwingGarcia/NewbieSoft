package com.newbie.newbiecore.util;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public static String format(Instant instant) {
        return FORMATTER.format(instant);
    }

    public static Instant now() {
        return Instant.now();
    }
}
