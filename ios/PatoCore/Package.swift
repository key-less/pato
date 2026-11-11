// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "PatoCore",
    platforms: [.iOS(.v17), .macOS(.v13)],
    products: [.library(name: "PatoCore", targets: ["PatoCore"])],
    targets: [
        .target(name: "PatoCore"),
        .testTarget(name: "PatoCoreTests", dependencies: ["PatoCore"]),
    ]
)
