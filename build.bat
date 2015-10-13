set ANDROID_HOME=E:\Android\sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
cordova build --release android
cd platforms\android\build\outputs\apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore teamaid-release-key.keystore android-release-unsigned.apk alias_name
zipalign -v 4 android-release-unsigned.apk TeamAid.apk
exit

