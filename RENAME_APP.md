# Renaming the App

The current working title is **VIT Chennai Student Utility**. To rename the app suitable for the store (e.g., "VITC Connect", "ReFind VITC"), follow these steps:

1.  **Rename Bundle ID & Package Name**:
    Use the `change_app_package_name` package or manually update:
    - `android/app/build.gradle`: `applicationId`
    - `android/app/src/main/AndroidManifest.xml`: `package` attribute
    - `ios/Runner.xcodeproj/project.pbxproj`: `PRODUCT_BUNDLE_IDENTIFIER`

2.  **Rename Display Name**:
    - `android/app/src/main/AndroidManifest.xml`: `android:label`
    - `ios/Runner/Info.plist`: `CFBundleDisplayName` and `CFBundleName`
    - `web/index.html`: `<title>` tag
    - `windows/runner/main.cpp`: Window title

3.  **Update Launcher Icon**:
    Use `flutter_launcher_icons` to generate new icons matching the new branding.

4.  **Firebase Project**:
    If you have already set up Firebase, you may need to add new apps with the new Bundle ID/Package Name to the Firebase project and download updated `google-services.json` / `GoogleService-Info.plist`.
