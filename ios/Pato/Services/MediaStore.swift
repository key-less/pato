import UIKit

/// Fotos del álbum guardadas como JPEG en Documentos/media.
enum MediaStore {
    private static let cache = NSCache<NSString, UIImage>()

    static var directory: URL {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("media", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    static func url(for fileName: String) -> URL {
        directory.appendingPathComponent(fileName)
    }

    static func exists(_ fileName: String) -> Bool {
        FileManager.default.fileExists(atPath: url(for: fileName).path)
    }

    /// Reduce la foto (lado mayor 1600 px) y la guarda. Devuelve el nombre del archivo.
    static func save(imageData: Data) -> String? {
        guard let image = UIImage(data: imageData) else { return nil }
        let longest = max(image.size.width, image.size.height)
        let scale = min(1, 1600 / max(longest, 1))
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
        guard let jpeg = resized.jpegData(compressionQuality: 0.82) else { return nil }
        let name = "\(UUID().uuidString.lowercased()).jpg"
        do {
            try jpeg.write(to: url(for: name), options: .atomic)
            return name
        } catch {
            return nil
        }
    }

    static func write(_ data: Data, fileName: String) {
        try? data.write(to: url(for: fileName), options: .atomic)
    }

    static func data(for fileName: String) -> Data? {
        try? Data(contentsOf: url(for: fileName))
    }

    static func image(for fileName: String) -> UIImage? {
        if let cached = cache.object(forKey: fileName as NSString) { return cached }
        guard let image = UIImage(contentsOfFile: url(for: fileName).path) else { return nil }
        cache.setObject(image, forKey: fileName as NSString)
        return image
    }

    static func delete(_ fileName: String) {
        cache.removeObject(forKey: fileName as NSString)
        try? FileManager.default.removeItem(at: url(for: fileName))
    }
}
