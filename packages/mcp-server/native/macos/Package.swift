// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "servo-helper",
    platforms: [.macOS(.v12)],
    targets: [
        .executableTarget(
            name: "servo-helper",
            path: "Sources"
        )
    ]
)
