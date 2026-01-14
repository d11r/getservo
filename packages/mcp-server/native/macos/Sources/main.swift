import Cocoa
import CoreGraphics
import ApplicationServices
import Foundation

// MARK: - JSON Output Helpers

struct JSONOutput: Encodable {
    let success: Bool
    let data: AnyCodable?
    let error: String?

    static func success(_ data: Any? = nil) -> JSONOutput {
        JSONOutput(success: true, data: data.map { AnyCodable($0) }, error: nil)
    }

    static func failure(_ error: String) -> JSONOutput {
        JSONOutput(success: false, data: nil, error: error)
    }
}

struct AnyCodable: Encodable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let v as String: try container.encode(v)
        case let v as Int: try container.encode(v)
        case let v as Double: try container.encode(v)
        case let v as Bool: try container.encode(v)
        case let v as [String: Any]:
            try container.encode(v.mapValues { AnyCodable($0) })
        case let v as [Any]:
            try container.encode(v.map { AnyCodable($0) })
        default:
            try container.encode(String(describing: value))
        }
    }
}

func output(_ result: JSONOutput) {
    let encoder = JSONEncoder()
    encoder.outputFormatting = .sortedKeys
    if let data = try? encoder.encode(result),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
}

// MARK: - Screenshot

func takeScreenshot() -> JSONOutput {
    let tempPath = "/tmp/servo-screenshot-\(ProcessInfo.processInfo.processIdentifier).png"

    // Use screencapture CLI - fast and reliable
    let task = Process()
    task.launchPath = "/usr/sbin/screencapture"
    task.arguments = ["-x", "-t", "png", tempPath]

    do {
        try task.run()
        task.waitUntilExit()

        guard task.terminationStatus == 0 else {
            return .failure("screencapture failed with status \(task.terminationStatus)")
        }

        let data = try Data(contentsOf: URL(fileURLWithPath: tempPath))
        let base64 = data.base64EncodedString()

        // Clean up
        try? FileManager.default.removeItem(atPath: tempPath)

        // Get dimensions from image
        if let image = NSImage(contentsOfFile: tempPath) {
            return .success(["base64": base64, "width": Int(image.size.width), "height": Int(image.size.height)])
        }

        return .success(["base64": base64])
    } catch {
        return .failure("Screenshot failed: \(error.localizedDescription)")
    }
}

// MARK: - Mouse Control

func moveMouse(x: Double, y: Double) -> JSONOutput {
    let point = CGPoint(x: x, y: y)
    guard let event = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left) else {
        return .failure("Failed to create mouse event")
    }
    event.post(tap: CGEventTapLocation.cghidEventTap)
    return .success()
}

func click(x: Double, y: Double, button: String, clicks: Int) -> JSONOutput {
    let point = CGPoint(x: x, y: y)

    let downType: CGEventType
    let upType: CGEventType
    let mouseButton: CGMouseButton

    switch button {
    case "right":
        downType = .rightMouseDown
        upType = .rightMouseUp
        mouseButton = .right
    case "middle":
        downType = .otherMouseDown
        upType = .otherMouseUp
        mouseButton = .center
    default:
        downType = .leftMouseDown
        upType = .leftMouseUp
        mouseButton = .left
    }

    // Move first
    if let moveEvent = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left) {
        moveEvent.post(tap: CGEventTapLocation.cghidEventTap)
        usleep(10000) // 10ms
    }

    // Click
    for i in 0..<clicks {
        guard let downEvent = CGEvent(mouseEventSource: nil, mouseType: downType, mouseCursorPosition: point, mouseButton: mouseButton),
              let upEvent = CGEvent(mouseEventSource: nil, mouseType: upType, mouseCursorPosition: point, mouseButton: mouseButton) else {
            return .failure("Failed to create click event")
        }

        // Set click count for double/triple clicks
        downEvent.setIntegerValueField(.mouseEventClickState, value: Int64(i + 1))
        upEvent.setIntegerValueField(.mouseEventClickState, value: Int64(i + 1))

        downEvent.post(tap: CGEventTapLocation.cghidEventTap)
        upEvent.post(tap: CGEventTapLocation.cghidEventTap)
        usleep(10000)
    }

    return .success()
}

func getMousePosition() -> JSONOutput {
    let location = NSEvent.mouseLocation
    let screenHeight = NSScreen.main?.frame.height ?? 0
    // Convert from bottom-left to top-left coordinate system
    return .success(["x": Int(location.x), "y": Int(screenHeight - location.y)])
}

func scroll(direction: String, amount: Int) -> JSONOutput {
    let deltaY: Int32
    let deltaX: Int32

    switch direction {
    case "up":
        deltaY = Int32(amount * 10)
        deltaX = 0
    case "down":
        deltaY = Int32(-amount * 10)
        deltaX = 0
    case "left":
        deltaY = 0
        deltaX = Int32(amount * 10)
    case "right":
        deltaY = 0
        deltaX = Int32(-amount * 10)
    default:
        deltaY = 0
        deltaX = 0
    }

    guard let event = CGEvent(scrollWheelEvent2Source: nil, units: .line, wheelCount: 2, wheel1: deltaY, wheel2: deltaX, wheel3: 0) else {
        return .failure("Failed to create scroll event")
    }
    event.post(tap: CGEventTapLocation.cghidEventTap)
    return .success()
}

// MARK: - Keyboard Control

let keyCodeMap: [String: CGKeyCode] = [
    "return": 36, "enter": 36, "tab": 48, "space": 49,
    "delete": 51, "backspace": 51, "escape": 53, "esc": 53,
    "left": 123, "right": 124, "down": 125, "up": 126,
    "f1": 122, "f2": 120, "f3": 99, "f4": 118, "f5": 96,
    "f6": 97, "f7": 98, "f8": 100, "f9": 101, "f10": 109,
    "f11": 103, "f12": 111, "home": 115, "end": 119,
    "pageup": 116, "pagedown": 121
]

func typeText(text: String) -> JSONOutput {
    for char in text {
        if char == "\n" {
            _ = keyPress(key: "return", modifiers: [])
        } else {
            let str = String(char)
            guard let event = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true) else {
                return .failure("Failed to create keyboard event")
            }
            event.keyboardSetUnicodeString(stringLength: str.count, unicodeString: Array(str.utf16))
            event.post(tap: CGEventTapLocation.cghidEventTap)

            guard let upEvent = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false) else {
                return .failure("Failed to create keyboard event")
            }
            upEvent.keyboardSetUnicodeString(stringLength: str.count, unicodeString: Array(str.utf16))
            upEvent.post(tap: CGEventTapLocation.cghidEventTap)
            usleep(5000)
        }
    }
    return .success()
}

func keyPress(key: String, modifiers: [String]) -> JSONOutput {
    var flags: CGEventFlags = []
    for mod in modifiers {
        switch mod.lowercased() {
        case "cmd", "command", "meta": flags.insert(.maskCommand)
        case "ctrl", "control": flags.insert(.maskControl)
        case "alt", "option": flags.insert(.maskAlternate)
        case "shift": flags.insert(.maskShift)
        default: break
        }
    }

    if let code = keyCodeMap[key.lowercased()] {
        guard let downEvent = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: true),
              let upEvent = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false) else {
            return .failure("Failed to create keyboard event")
        }
        downEvent.flags = flags
        upEvent.flags = flags
        downEvent.post(tap: CGEventTapLocation.cghidEventTap)
        upEvent.post(tap: CGEventTapLocation.cghidEventTap)
        return .success()
    } else if key.count == 1 {
        // For single characters, use the unicode approach
        guard let downEvent = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true),
              let upEvent = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false) else {
            return .failure("Failed to create keyboard event")
        }
        let str = String(key)
        downEvent.keyboardSetUnicodeString(stringLength: 1, unicodeString: Array(str.utf16))
        upEvent.keyboardSetUnicodeString(stringLength: 1, unicodeString: Array(str.utf16))
        downEvent.flags = flags
        upEvent.flags = flags
        downEvent.post(tap: CGEventTapLocation.cghidEventTap)
        upEvent.post(tap: CGEventTapLocation.cghidEventTap)
        return .success()
    } else {
        return .failure("Unknown key: \(key)")
    }
}

// MARK: - Window Management

func listWindows() -> JSONOutput {
    let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
    guard let windowList = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
        return .failure("Failed to get window list")
    }

    var windows: [[String: Any]] = []
    for window in windowList {
        guard let ownerName = window[kCGWindowOwnerName as String] as? String,
              let bounds = window[kCGWindowBounds as String] as? [String: Any],
              let layer = window[kCGWindowLayer as String] as? Int,
              layer == 0 else { // Only normal windows
            continue
        }

        let title = window[kCGWindowName as String] as? String ?? ""
        let x = bounds["X"] as? Double ?? 0
        let y = bounds["Y"] as? Double ?? 0
        let width = bounds["Width"] as? Double ?? 0
        let height = bounds["Height"] as? Double ?? 0

        windows.append([
            "app": ownerName,
            "title": title,
            "bounds": ["x": Int(x), "y": Int(y), "width": Int(width), "height": Int(height)]
        ])
    }

    return .success(windows)
}

func focusApp(name: String) -> JSONOutput {
    let apps = NSWorkspace.shared.runningApplications.filter {
        $0.localizedName?.lowercased() == name.lowercased() ||
        $0.bundleIdentifier?.lowercased().contains(name.lowercased()) == true
    }

    guard let app = apps.first else {
        return .failure("App not found: \(name)")
    }

    app.activate()
    return .success()
}

func openApp(name: String) -> JSONOutput {
    let task = Process()
    task.launchPath = "/usr/bin/open"
    task.arguments = ["-a", name]
    do {
        try task.run()
        task.waitUntilExit()
        if task.terminationStatus == 0 {
            return .success()
        } else {
            return .failure("Failed to open app: \(name)")
        }
    } catch {
        return .failure("Failed to open app: \(name) - \(error.localizedDescription)")
    }
}

// MARK: - Accessibility API

func getUIElements(appName: String?, role: String?, maxDepth: Int = 5) -> JSONOutput {
    var elements: [[String: Any]] = []

    let apps: [NSRunningApplication]
    if let name = appName {
        apps = NSWorkspace.shared.runningApplications.filter {
            $0.localizedName?.lowercased() == name.lowercased()
        }
    } else {
        // Get frontmost app
        if let frontApp = NSWorkspace.shared.frontmostApplication {
            apps = [frontApp]
        } else {
            apps = []
        }
    }

    guard let app = apps.first else {
        return .failure("App not found")
    }

    let appElement = AXUIElementCreateApplication(app.processIdentifier)

    func traverse(_ element: AXUIElement, depth: Int) {
        guard depth < maxDepth else { return }

        var roleRef: CFTypeRef?
        var titleRef: CFTypeRef?
        var positionRef: CFTypeRef?
        var sizeRef: CFTypeRef?
        var enabledRef: CFTypeRef?

        AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)
        AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &titleRef)
        AXUIElementCopyAttributeValue(element, kAXPositionAttribute as CFString, &positionRef)
        AXUIElementCopyAttributeValue(element, kAXSizeAttribute as CFString, &sizeRef)
        AXUIElementCopyAttributeValue(element, kAXEnabledAttribute as CFString, &enabledRef)

        let elementRole = roleRef as? String ?? ""
        let elementTitle = titleRef as? String ?? ""

        // Filter by role if specified
        let matchesRole = role == nil || elementRole.lowercased().contains(role!.lowercased())

        // Only include interactive elements with titles
        let interactiveRoles = ["AXButton", "AXTextField", "AXTextArea", "AXCheckBox",
                                "AXRadioButton", "AXPopUpButton", "AXComboBox", "AXSlider",
                                "AXMenuItem", "AXMenuButton", "AXLink", "AXTab"]
        let isInteractive = interactiveRoles.contains(elementRole)

        if matchesRole && (isInteractive || !elementTitle.isEmpty) {
            var position: CGPoint = .zero
            var size: CGSize = .zero

            if let posRef = positionRef {
                AXValueGetValue(posRef as! AXValue, .cgPoint, &position)
            }
            if let sizeRef = sizeRef {
                AXValueGetValue(sizeRef as! AXValue, .cgSize, &size)
            }

            // Get additional attributes for identification
            var identifierRef: CFTypeRef?
            var descriptionRef: CFTypeRef?
            var valueRef: CFTypeRef?
            AXUIElementCopyAttributeValue(element, kAXIdentifierAttribute as CFString, &identifierRef)
            AXUIElementCopyAttributeValue(element, kAXDescriptionAttribute as CFString, &descriptionRef)
            AXUIElementCopyAttributeValue(element, kAXValueAttribute as CFString, &valueRef)

            var elementInfo: [String: Any] = [
                "role": elementRole,
                "title": elementTitle,
                "bounds": [
                    "x": Int(position.x),
                    "y": Int(position.y),
                    "width": Int(size.width),
                    "height": Int(size.height)
                ]
            ]

            if let identifier = identifierRef as? String, !identifier.isEmpty {
                elementInfo["identifier"] = identifier
            }
            if let description = descriptionRef as? String, !description.isEmpty {
                elementInfo["description"] = description
            }
            if let value = valueRef as? String, !value.isEmpty {
                elementInfo["value"] = value
            }
            if let enabled = enabledRef as? Bool {
                elementInfo["enabled"] = enabled
            }

            elements.append(elementInfo)
        }

        // Traverse children
        var childrenRef: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
        if let children = childrenRef as? [AXUIElement] {
            for child in children {
                traverse(child, depth: depth + 1)
            }
        }
    }

    traverse(appElement, depth: 0)
    return .success(elements)
}

func clickElement(title: String?, role: String?, identifier: String?) -> JSONOutput {
    guard let app = NSWorkspace.shared.frontmostApplication else {
        return .failure("No frontmost app")
    }

    let appElement = AXUIElementCreateApplication(app.processIdentifier)

    func findAndClick(_ element: AXUIElement, depth: Int) -> Bool {
        guard depth < 10 else { return false }

        var roleRef: CFTypeRef?
        var titleRef: CFTypeRef?
        var identifierRef: CFTypeRef?

        AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)
        AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &titleRef)
        AXUIElementCopyAttributeValue(element, kAXIdentifierAttribute as CFString, &identifierRef)

        let elementRole = roleRef as? String ?? ""
        let elementTitle = titleRef as? String ?? ""
        let elementId = identifierRef as? String ?? ""

        // Check if this element matches
        var matches = true
        if let t = title, !t.isEmpty {
            matches = matches && elementTitle.lowercased().contains(t.lowercased())
        }
        if let r = role, !r.isEmpty {
            matches = matches && elementRole.lowercased().contains(r.lowercased())
        }
        if let i = identifier, !i.isEmpty {
            matches = matches && elementId.lowercased().contains(i.lowercased())
        }

        if matches && (title != nil || role != nil || identifier != nil) {
            // Try to perform press action
            let result = AXUIElementPerformAction(element, kAXPressAction as CFString)
            if result == .success {
                return true
            }

            // Fallback: click at center of element
            var positionRef: CFTypeRef?
            var sizeRef: CFTypeRef?
            AXUIElementCopyAttributeValue(element, kAXPositionAttribute as CFString, &positionRef)
            AXUIElementCopyAttributeValue(element, kAXSizeAttribute as CFString, &sizeRef)

            if let posRef = positionRef, let szRef = sizeRef {
                var position: CGPoint = .zero
                var size: CGSize = .zero
                AXValueGetValue(posRef as! AXValue, .cgPoint, &position)
                AXValueGetValue(szRef as! AXValue, .cgSize, &size)

                let centerX = position.x + size.width / 2
                let centerY = position.y + size.height / 2
                _ = click(x: centerX, y: centerY, button: "left", clicks: 1)
                return true
            }
        }

        // Search children
        var childrenRef: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
        if let children = childrenRef as? [AXUIElement] {
            for child in children {
                if findAndClick(child, depth: depth + 1) {
                    return true
                }
            }
        }

        return false
    }

    if findAndClick(appElement, depth: 0) {
        return .success()
    } else {
        return .failure("Element not found")
    }
}

func getElementText(title: String?, role: String?, identifier: String?) -> JSONOutput {
    guard let app = NSWorkspace.shared.frontmostApplication else {
        return .failure("No frontmost app")
    }

    let appElement = AXUIElementCreateApplication(app.processIdentifier)

    func findElement(_ element: AXUIElement, depth: Int) -> String? {
        guard depth < 10 else { return nil }

        var roleRef: CFTypeRef?
        var titleRef: CFTypeRef?
        var identifierRef: CFTypeRef?
        var valueRef: CFTypeRef?

        AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)
        AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &titleRef)
        AXUIElementCopyAttributeValue(element, kAXIdentifierAttribute as CFString, &identifierRef)
        AXUIElementCopyAttributeValue(element, kAXValueAttribute as CFString, &valueRef)

        let elementRole = roleRef as? String ?? ""
        let elementTitle = titleRef as? String ?? ""
        let elementId = identifierRef as? String ?? ""

        var matches = true
        if let t = title, !t.isEmpty {
            matches = matches && elementTitle.lowercased().contains(t.lowercased())
        }
        if let r = role, !r.isEmpty {
            matches = matches && elementRole.lowercased().contains(r.lowercased())
        }
        if let i = identifier, !i.isEmpty {
            matches = matches && elementId.lowercased().contains(i.lowercased())
        }

        if matches && (title != nil || role != nil || identifier != nil) {
            return valueRef as? String ?? elementTitle
        }

        var childrenRef: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
        if let children = childrenRef as? [AXUIElement] {
            for child in children {
                if let result = findElement(child, depth: depth + 1) {
                    return result
                }
            }
        }

        return nil
    }

    if let text = findElement(appElement, depth: 0) {
        return .success(["text": text])
    } else {
        return .failure("Element not found")
    }
}

func focusElement(title: String?, role: String?, identifier: String?) -> JSONOutput {
    guard let app = NSWorkspace.shared.frontmostApplication else {
        return .failure("No frontmost app")
    }

    let appElement = AXUIElementCreateApplication(app.processIdentifier)

    func findAndFocus(_ element: AXUIElement, depth: Int) -> Bool {
        guard depth < 10 else { return false }

        var roleRef: CFTypeRef?
        var titleRef: CFTypeRef?
        var identifierRef: CFTypeRef?

        AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)
        AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &titleRef)
        AXUIElementCopyAttributeValue(element, kAXIdentifierAttribute as CFString, &identifierRef)

        let elementRole = roleRef as? String ?? ""
        let elementTitle = titleRef as? String ?? ""
        let elementId = identifierRef as? String ?? ""

        var matches = true
        if let t = title, !t.isEmpty {
            matches = matches && elementTitle.lowercased().contains(t.lowercased())
        }
        if let r = role, !r.isEmpty {
            matches = matches && elementRole.lowercased().contains(r.lowercased())
        }
        if let i = identifier, !i.isEmpty {
            matches = matches && elementId.lowercased().contains(i.lowercased())
        }

        if matches && (title != nil || role != nil || identifier != nil) {
            AXUIElementSetAttributeValue(element, kAXFocusedAttribute as CFString, true as CFTypeRef)
            return true
        }

        var childrenRef: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
        if let children = childrenRef as? [AXUIElement] {
            for child in children {
                if findAndFocus(child, depth: depth + 1) {
                    return true
                }
            }
        }

        return false
    }

    if findAndFocus(appElement, depth: 0) {
        return .success()
    } else {
        return .failure("Element not found")
    }
}

// MARK: - Main

func printUsage() {
    let usage = """
    servo-helper - Native automation helper for Servo MCP

    Commands:
      screenshot                              Capture screen as base64 PNG
      click <x> <y> [button] [clicks]        Click at coordinates
      move <x> <y>                           Move mouse to coordinates
      position                               Get current mouse position
      scroll <direction> [amount]            Scroll (up/down/left/right)
      type <text>                            Type text
      key <key> [modifiers...]               Press key with modifiers
      windows                                List all windows
      focus-app <name>                       Focus an application
      open-app <name>                        Open an application

    Accessibility commands:
      list-elements [--app name] [--role role]     List UI elements
      click-element [--title t] [--role r] [--id i]  Click element
      get-text [--title t] [--role r] [--id i]       Get element text
      focus-element [--title t] [--role r] [--id i]  Focus element
    """
    print(usage)
}

func main() {
    let args = Array(CommandLine.arguments.dropFirst())

    guard !args.isEmpty else {
        printUsage()
        exit(1)
    }

    let command = args[0]

    switch command {
    case "screenshot":
        output(takeScreenshot())

    case "click":
        guard args.count >= 3,
              let x = Double(args[1]),
              let y = Double(args[2]) else {
            output(.failure("Usage: click <x> <y> [button] [clicks]"))
            exit(1)
        }
        let button = args.count > 3 ? args[3] : "left"
        let clicks = args.count > 4 ? Int(args[4]) ?? 1 : 1
        output(click(x: x, y: y, button: button, clicks: clicks))

    case "move":
        guard args.count >= 3,
              let x = Double(args[1]),
              let y = Double(args[2]) else {
            output(.failure("Usage: move <x> <y>"))
            exit(1)
        }
        output(moveMouse(x: x, y: y))

    case "position":
        output(getMousePosition())

    case "scroll":
        guard args.count >= 2 else {
            output(.failure("Usage: scroll <direction> [amount]"))
            exit(1)
        }
        let direction = args[1]
        let amount = args.count > 2 ? Int(args[2]) ?? 3 : 3
        output(scroll(direction: direction, amount: amount))

    case "type":
        guard args.count >= 2 else {
            output(.failure("Usage: type <text>"))
            exit(1)
        }
        let text = args.dropFirst().joined(separator: " ")
        output(typeText(text: text))

    case "key":
        guard args.count >= 2 else {
            output(.failure("Usage: key <key> [modifiers...]"))
            exit(1)
        }
        let key = args[1]
        let modifiers = Array(args.dropFirst(2))
        output(keyPress(key: key, modifiers: modifiers))

    case "windows":
        output(listWindows())

    case "focus-app":
        guard args.count >= 2 else {
            output(.failure("Usage: focus-app <name>"))
            exit(1)
        }
        let name = args.dropFirst().joined(separator: " ")
        output(focusApp(name: name))

    case "open-app":
        guard args.count >= 2 else {
            output(.failure("Usage: open-app <name>"))
            exit(1)
        }
        let name = args.dropFirst().joined(separator: " ")
        output(openApp(name: name))

    case "list-elements":
        var appName: String?
        var role: String?
        var i = 1
        while i < args.count {
            if args[i] == "--app" && i + 1 < args.count {
                appName = args[i + 1]
                i += 2
            } else if args[i] == "--role" && i + 1 < args.count {
                role = args[i + 1]
                i += 2
            } else {
                i += 1
            }
        }
        output(getUIElements(appName: appName, role: role))

    case "click-element":
        var title: String?
        var role: String?
        var identifier: String?
        var i = 1
        while i < args.count {
            if args[i] == "--title" && i + 1 < args.count {
                title = args[i + 1]
                i += 2
            } else if args[i] == "--role" && i + 1 < args.count {
                role = args[i + 1]
                i += 2
            } else if args[i] == "--id" && i + 1 < args.count {
                identifier = args[i + 1]
                i += 2
            } else {
                i += 1
            }
        }
        output(clickElement(title: title, role: role, identifier: identifier))

    case "get-text":
        var title: String?
        var role: String?
        var identifier: String?
        var i = 1
        while i < args.count {
            if args[i] == "--title" && i + 1 < args.count {
                title = args[i + 1]
                i += 2
            } else if args[i] == "--role" && i + 1 < args.count {
                role = args[i + 1]
                i += 2
            } else if args[i] == "--id" && i + 1 < args.count {
                identifier = args[i + 1]
                i += 2
            } else {
                i += 1
            }
        }
        output(getElementText(title: title, role: role, identifier: identifier))

    case "focus-element":
        var title: String?
        var role: String?
        var identifier: String?
        var i = 1
        while i < args.count {
            if args[i] == "--title" && i + 1 < args.count {
                title = args[i + 1]
                i += 2
            } else if args[i] == "--role" && i + 1 < args.count {
                role = args[i + 1]
                i += 2
            } else if args[i] == "--id" && i + 1 < args.count {
                identifier = args[i + 1]
                i += 2
            } else {
                i += 1
            }
        }
        output(focusElement(title: title, role: role, identifier: identifier))

    default:
        output(.failure("Unknown command: \(command)"))
        exit(1)
    }
}

main()
