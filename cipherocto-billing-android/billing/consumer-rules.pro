# kotlinx.serialization keeps generated serializers; everything else is plain Kotlin.
-keepattributes *Annotation*, InnerClasses
-keepclassmembers class app.cipherocto.billing.internal.** { *** Companion; }
-keepclasseswithmembers class app.cipherocto.billing.internal.** { kotlinx.serialization.KSerializer serializer(...); }
