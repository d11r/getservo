using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Windows.Automation;

namespace ServoHelper;

class Program
{
    static void Main(string[] args)
    {
        if (args.Length == 0)
        {
            PrintUsage();
            Environment.Exit(1);
        }

        var command = args[0].ToLower();

        try
        {
            switch (command)
            {
                case "screenshot":
                    Output(TakeScreenshot());
                    break;

                case "click":
                    if (args.Length < 3 || !int.TryParse(args[1], out int cx) || !int.TryParse(args[2], out int cy))
                    {
                        Output(JsonResult.Failure("Usage: click <x> <y> [button] [clicks]"));
                        Environment.Exit(1);
                    }
                    var button = args.Length > 3 ? args[3] : "left";
                    var clicks = args.Length > 4 && int.TryParse(args[4], out int c) ? c : 1;
                    Output(Click(cx, cy, button, clicks));
                    break;

                case "move":
                    if (args.Length < 3 || !int.TryParse(args[1], out int mx) || !int.TryParse(args[2], out int my))
                    {
                        Output(JsonResult.Failure("Usage: move <x> <y>"));
                        Environment.Exit(1);
                    }
                    Output(MoveMouse(mx, my));
                    break;

                case "position":
                    Output(GetMousePosition());
                    break;

                case "scroll":
                    if (args.Length < 2)
                    {
                        Output(JsonResult.Failure("Usage: scroll <direction> [amount]"));
                        Environment.Exit(1);
                    }
                    var direction = args[1];
                    var amount = args.Length > 2 && int.TryParse(args[2], out int a) ? a : 3;
                    Output(Scroll(direction, amount));
                    break;

                case "type":
                    if (args.Length < 2)
                    {
                        Output(JsonResult.Failure("Usage: type <text>"));
                        Environment.Exit(1);
                    }
                    var text = string.Join(" ", args[1..]);
                    Output(TypeText(text));
                    break;

                case "key":
                    if (args.Length < 2)
                    {
                        Output(JsonResult.Failure("Usage: key <key> [modifiers...]"));
                        Environment.Exit(1);
                    }
                    var key = args[1];
                    var modifiers = args.Length > 2 ? args[2..] : Array.Empty<string>();
                    Output(KeyPress(key, modifiers));
                    break;

                case "windows":
                    Output(ListWindows());
                    break;

                case "focus-app":
                    if (args.Length < 2)
                    {
                        Output(JsonResult.Failure("Usage: focus-app <name>"));
                        Environment.Exit(1);
                    }
                    Output(FocusApp(string.Join(" ", args[1..])));
                    break;

                case "open-app":
                    if (args.Length < 2)
                    {
                        Output(JsonResult.Failure("Usage: open-app <name>"));
                        Environment.Exit(1);
                    }
                    Output(OpenApp(string.Join(" ", args[1..])));
                    break;

                case "list-elements":
                    {
                        string? appName = null;
                        string? role = null;
                        for (int i = 1; i < args.Length; i++)
                        {
                            if (args[i] == "--app" && i + 1 < args.Length)
                            {
                                appName = args[++i];
                            }
                            else if (args[i] == "--role" && i + 1 < args.Length)
                            {
                                role = args[++i];
                            }
                        }
                        Output(ListUIElements(appName, role));
                    }
                    break;

                case "click-element":
                    {
                        string? title = null, role = null, identifier = null;
                        for (int i = 1; i < args.Length; i++)
                        {
                            if (args[i] == "--title" && i + 1 < args.Length)
                                title = args[++i];
                            else if (args[i] == "--role" && i + 1 < args.Length)
                                role = args[++i];
                            else if (args[i] == "--id" && i + 1 < args.Length)
                                identifier = args[++i];
                        }
                        Output(ClickElement(title, role, identifier));
                    }
                    break;

                case "get-text":
                    {
                        string? title = null, role = null, identifier = null;
                        for (int i = 1; i < args.Length; i++)
                        {
                            if (args[i] == "--title" && i + 1 < args.Length)
                                title = args[++i];
                            else if (args[i] == "--role" && i + 1 < args.Length)
                                role = args[++i];
                            else if (args[i] == "--id" && i + 1 < args.Length)
                                identifier = args[++i];
                        }
                        Output(GetElementText(title, role, identifier));
                    }
                    break;

                case "focus-element":
                    {
                        string? title = null, role = null, identifier = null;
                        for (int i = 1; i < args.Length; i++)
                        {
                            if (args[i] == "--title" && i + 1 < args.Length)
                                title = args[++i];
                            else if (args[i] == "--role" && i + 1 < args.Length)
                                role = args[++i];
                            else if (args[i] == "--id" && i + 1 < args.Length)
                                identifier = args[++i];
                        }
                        Output(FocusElement(title, role, identifier));
                    }
                    break;

                default:
                    Output(JsonResult.Failure($"Unknown command: {command}"));
                    Environment.Exit(1);
                    break;
            }
        }
        catch (Exception ex)
        {
            Output(JsonResult.Failure(ex.Message));
            Environment.Exit(1);
        }
    }

    static void PrintUsage()
    {
        Console.WriteLine(@"servo-helper - Native automation helper for Servo MCP

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
  focus-element [--title t] [--role r] [--id i]  Focus element");
    }

    static void Output(JsonResult result)
    {
        var options = new JsonSerializerOptions { WriteIndented = false };
        Console.WriteLine(JsonSerializer.Serialize(result, options));
    }

    #region Win32 API

    [DllImport("user32.dll")]
    static extern bool SetCursorPos(int x, int y);

    [DllImport("user32.dll")]
    static extern void mouse_event(uint dwFlags, uint dx, uint dy, int dwData, int dwExtraInfo);

    [DllImport("user32.dll")]
    static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern short VkKeyScan(char ch);

    [DllImport("user32.dll")]
    static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential)]
    struct POINT { public int X; public int Y; }

    [StructLayout(LayoutKind.Sequential)]
    struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

    const uint MOUSEEVENTF_LEFTDOWN = 0x02;
    const uint MOUSEEVENTF_LEFTUP = 0x04;
    const uint MOUSEEVENTF_RIGHTDOWN = 0x08;
    const uint MOUSEEVENTF_RIGHTUP = 0x10;
    const uint MOUSEEVENTF_MIDDLEDOWN = 0x20;
    const uint MOUSEEVENTF_MIDDLEUP = 0x40;
    const uint MOUSEEVENTF_WHEEL = 0x0800;
    const uint MOUSEEVENTF_HWHEEL = 0x1000;
    const uint KEYEVENTF_KEYUP = 0x02;
    const int SW_RESTORE = 9;

    #endregion

    #region Screenshot

    static JsonResult TakeScreenshot()
    {
        var bounds = System.Windows.Forms.Screen.PrimaryScreen!.Bounds;
        using var bitmap = new Bitmap(bounds.Width, bounds.Height);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.CopyFromScreen(bounds.Location, Point.Empty, bounds.Size);

        using var ms = new MemoryStream();
        bitmap.Save(ms, ImageFormat.Png);
        var base64 = Convert.ToBase64String(ms.ToArray());

        return JsonResult.Success(new Dictionary<string, object>
        {
            ["base64"] = base64,
            ["width"] = bounds.Width,
            ["height"] = bounds.Height
        });
    }

    #endregion

    #region Mouse

    static JsonResult MoveMouse(int x, int y)
    {
        SetCursorPos(x, y);
        return JsonResult.Success();
    }

    static JsonResult Click(int x, int y, string button, int clicks)
    {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(10);

        uint downFlag, upFlag;
        switch (button.ToLower())
        {
            case "right":
                downFlag = MOUSEEVENTF_RIGHTDOWN;
                upFlag = MOUSEEVENTF_RIGHTUP;
                break;
            case "middle":
                downFlag = MOUSEEVENTF_MIDDLEDOWN;
                upFlag = MOUSEEVENTF_MIDDLEUP;
                break;
            default:
                downFlag = MOUSEEVENTF_LEFTDOWN;
                upFlag = MOUSEEVENTF_LEFTUP;
                break;
        }

        for (int i = 0; i < clicks; i++)
        {
            mouse_event(downFlag, 0, 0, 0, 0);
            mouse_event(upFlag, 0, 0, 0, 0);
            System.Threading.Thread.Sleep(10);
        }

        return JsonResult.Success();
    }

    static JsonResult GetMousePosition()
    {
        GetCursorPos(out POINT point);
        return JsonResult.Success(new Dictionary<string, object>
        {
            ["x"] = point.X,
            ["y"] = point.Y
        });
    }

    static JsonResult Scroll(string direction, int amount)
    {
        int wheelDelta = 120 * amount;

        switch (direction.ToLower())
        {
            case "up":
                mouse_event(MOUSEEVENTF_WHEEL, 0, 0, wheelDelta, 0);
                break;
            case "down":
                mouse_event(MOUSEEVENTF_WHEEL, 0, 0, -wheelDelta, 0);
                break;
            case "left":
                mouse_event(MOUSEEVENTF_HWHEEL, 0, 0, -wheelDelta, 0);
                break;
            case "right":
                mouse_event(MOUSEEVENTF_HWHEEL, 0, 0, wheelDelta, 0);
                break;
        }

        return JsonResult.Success();
    }

    #endregion

    #region Keyboard

    static readonly Dictionary<string, byte> KeyCodeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["enter"] = 0x0D, ["return"] = 0x0D,
        ["tab"] = 0x09,
        ["space"] = 0x20,
        ["backspace"] = 0x08, ["delete"] = 0x2E,
        ["escape"] = 0x1B, ["esc"] = 0x1B,
        ["left"] = 0x25, ["up"] = 0x26, ["right"] = 0x27, ["down"] = 0x28,
        ["home"] = 0x24, ["end"] = 0x23,
        ["pageup"] = 0x21, ["pagedown"] = 0x22,
        ["f1"] = 0x70, ["f2"] = 0x71, ["f3"] = 0x72, ["f4"] = 0x73,
        ["f5"] = 0x74, ["f6"] = 0x75, ["f7"] = 0x76, ["f8"] = 0x77,
        ["f9"] = 0x78, ["f10"] = 0x79, ["f11"] = 0x7A, ["f12"] = 0x7B,
        ["ctrl"] = 0x11, ["control"] = 0x11,
        ["alt"] = 0x12, ["option"] = 0x12,
        ["shift"] = 0x10,
        ["meta"] = 0x5B, ["cmd"] = 0x5B, ["win"] = 0x5B
    };

    static JsonResult TypeText(string text)
    {
        foreach (char c in text)
        {
            if (c == '\n')
            {
                keybd_event(0x0D, 0, 0, UIntPtr.Zero);
                keybd_event(0x0D, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
            else
            {
                short vk = VkKeyScan(c);
                byte keyCode = (byte)(vk & 0xFF);
                bool shift = (vk & 0x100) != 0;

                if (shift) keybd_event(0x10, 0, 0, UIntPtr.Zero);
                keybd_event(keyCode, 0, 0, UIntPtr.Zero);
                keybd_event(keyCode, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                if (shift) keybd_event(0x10, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
            System.Threading.Thread.Sleep(5);
        }
        return JsonResult.Success();
    }

    static JsonResult KeyPress(string key, string[] modifiers)
    {
        // Press modifiers
        foreach (var mod in modifiers)
        {
            if (KeyCodeMap.TryGetValue(mod, out byte modCode))
            {
                keybd_event(modCode, 0, 0, UIntPtr.Zero);
            }
        }

        // Press key
        if (KeyCodeMap.TryGetValue(key, out byte keyCode))
        {
            keybd_event(keyCode, 0, 0, UIntPtr.Zero);
            keybd_event(keyCode, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }
        else if (key.Length == 1)
        {
            short vk = VkKeyScan(key[0]);
            byte code = (byte)(vk & 0xFF);
            keybd_event(code, 0, 0, UIntPtr.Zero);
            keybd_event(code, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }
        else
        {
            // Release modifiers before returning error
            foreach (var mod in modifiers)
            {
                if (KeyCodeMap.TryGetValue(mod, out byte modCode))
                {
                    keybd_event(modCode, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                }
            }
            return JsonResult.Failure($"Unknown key: {key}");
        }

        // Release modifiers
        foreach (var mod in modifiers)
        {
            if (KeyCodeMap.TryGetValue(mod, out byte modCode))
            {
                keybd_event(modCode, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
        }

        return JsonResult.Success();
    }

    #endregion

    #region Window Management

    static JsonResult ListWindows()
    {
        var windows = new List<Dictionary<string, object>>();

        EnumWindows((hWnd, lParam) =>
        {
            if (!IsWindowVisible(hWnd)) return true;

            var sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            var title = sb.ToString();

            if (string.IsNullOrWhiteSpace(title)) return true;

            GetWindowRect(hWnd, out RECT rect);
            GetWindowThreadProcessId(hWnd, out uint processId);

            string appName;
            try
            {
                var process = Process.GetProcessById((int)processId);
                appName = process.ProcessName;
            }
            catch
            {
                appName = "Unknown";
            }

            windows.Add(new Dictionary<string, object>
            {
                ["app"] = appName,
                ["title"] = title,
                ["bounds"] = new Dictionary<string, int>
                {
                    ["x"] = rect.Left,
                    ["y"] = rect.Top,
                    ["width"] = rect.Right - rect.Left,
                    ["height"] = rect.Bottom - rect.Top
                }
            });

            return true;
        }, IntPtr.Zero);

        return JsonResult.Success(windows);
    }

    static JsonResult FocusApp(string name)
    {
        var processes = Process.GetProcessesByName(name);
        if (processes.Length == 0)
        {
            // Try partial match
            processes = Process.GetProcesses()
                .Where(p => p.ProcessName.Contains(name, StringComparison.OrdinalIgnoreCase))
                .ToArray();
        }

        if (processes.Length == 0)
        {
            return JsonResult.Failure($"App not found: {name}");
        }

        var proc = processes.FirstOrDefault(p => p.MainWindowHandle != IntPtr.Zero);
        if (proc == null)
        {
            return JsonResult.Failure($"No visible window for: {name}");
        }

        ShowWindow(proc.MainWindowHandle, SW_RESTORE);
        SetForegroundWindow(proc.MainWindowHandle);

        return JsonResult.Success();
    }

    static JsonResult OpenApp(string name)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = name,
                UseShellExecute = true
            });
            return JsonResult.Success();
        }
        catch (Exception ex)
        {
            return JsonResult.Failure($"Failed to open: {ex.Message}");
        }
    }

    #endregion

    #region UI Automation

    static JsonResult ListUIElements(string? appName, string? role)
    {
        AutomationElement root;

        if (appName != null)
        {
            var processes = Process.GetProcessesByName(appName);
            if (processes.Length == 0)
            {
                processes = Process.GetProcesses()
                    .Where(p => p.ProcessName.Contains(appName, StringComparison.OrdinalIgnoreCase))
                    .ToArray();
            }

            var proc = processes.FirstOrDefault(p => p.MainWindowHandle != IntPtr.Zero);
            if (proc == null)
            {
                return JsonResult.Failure("App not found");
            }

            root = AutomationElement.FromHandle(proc.MainWindowHandle);
        }
        else
        {
            var foregroundWindow = GetForegroundWindow();
            if (foregroundWindow == IntPtr.Zero)
            {
                return JsonResult.Failure("No foreground window");
            }
            root = AutomationElement.FromHandle(foregroundWindow);
        }

        var elements = new List<Dictionary<string, object>>();
        var interactiveTypes = new HashSet<ControlType>
        {
            ControlType.Button, ControlType.CheckBox, ControlType.ComboBox,
            ControlType.Edit, ControlType.Hyperlink, ControlType.ListItem,
            ControlType.MenuItem, ControlType.RadioButton, ControlType.Slider,
            ControlType.Tab, ControlType.TabItem, ControlType.Text
        };

        void Traverse(AutomationElement element, int depth)
        {
            if (depth > 5) return;

            try
            {
                var controlType = element.Current.ControlType;
                var name = element.Current.Name ?? "";
                var automationId = element.Current.AutomationId ?? "";

                var roleStr = controlType.ProgrammaticName.Replace("ControlType.", "");
                var matchesRole = role == null || roleStr.Contains(role, StringComparison.OrdinalIgnoreCase);
                var isInteractive = interactiveTypes.Contains(controlType);

                if (matchesRole && (isInteractive || !string.IsNullOrEmpty(name)))
                {
                    var rect = element.Current.BoundingRectangle;
                    var elementInfo = new Dictionary<string, object>
                    {
                        ["role"] = roleStr,
                        ["title"] = name,
                        ["bounds"] = new Dictionary<string, int>
                        {
                            ["x"] = (int)rect.X,
                            ["y"] = (int)rect.Y,
                            ["width"] = (int)rect.Width,
                            ["height"] = (int)rect.Height
                        }
                    };

                    if (!string.IsNullOrEmpty(automationId))
                    {
                        elementInfo["identifier"] = automationId;
                    }

                    if (element.Current.IsEnabled)
                    {
                        elementInfo["enabled"] = true;
                    }

                    elements.Add(elementInfo);
                }

                var children = element.FindAll(TreeScope.Children, Condition.TrueCondition);
                foreach (AutomationElement child in children)
                {
                    Traverse(child, depth + 1);
                }
            }
            catch { }
        }

        Traverse(root, 0);
        return JsonResult.Success(elements);
    }

    static AutomationElement? FindElement(AutomationElement root, string? title, string? role, string? identifier, int maxDepth = 10)
    {
        AutomationElement? Search(AutomationElement element, int depth)
        {
            if (depth > maxDepth) return null;

            try
            {
                var name = element.Current.Name ?? "";
                var controlType = element.Current.ControlType.ProgrammaticName.Replace("ControlType.", "");
                var automationId = element.Current.AutomationId ?? "";

                bool matches = true;
                if (title != null && !string.IsNullOrEmpty(title))
                    matches = matches && name.Contains(title, StringComparison.OrdinalIgnoreCase);
                if (role != null && !string.IsNullOrEmpty(role))
                    matches = matches && controlType.Contains(role, StringComparison.OrdinalIgnoreCase);
                if (identifier != null && !string.IsNullOrEmpty(identifier))
                    matches = matches && automationId.Contains(identifier, StringComparison.OrdinalIgnoreCase);

                if (matches && (title != null || role != null || identifier != null))
                {
                    return element;
                }

                var children = element.FindAll(TreeScope.Children, Condition.TrueCondition);
                foreach (AutomationElement child in children)
                {
                    var found = Search(child, depth + 1);
                    if (found != null) return found;
                }
            }
            catch { }

            return null;
        }

        return Search(root, 0);
    }

    static JsonResult ClickElement(string? title, string? role, string? identifier)
    {
        var foregroundWindow = GetForegroundWindow();
        if (foregroundWindow == IntPtr.Zero)
        {
            return JsonResult.Failure("No foreground window");
        }

        var root = AutomationElement.FromHandle(foregroundWindow);
        var element = FindElement(root, title, role, identifier);

        if (element == null)
        {
            return JsonResult.Failure("Element not found");
        }

        try
        {
            // Try invoke pattern first
            if (element.TryGetCurrentPattern(InvokePattern.Pattern, out object? pattern))
            {
                ((InvokePattern)pattern).Invoke();
                return JsonResult.Success();
            }

            // Try toggle pattern
            if (element.TryGetCurrentPattern(TogglePattern.Pattern, out pattern))
            {
                ((TogglePattern)pattern).Toggle();
                return JsonResult.Success();
            }

            // Fallback: click at center
            var rect = element.Current.BoundingRectangle;
            var centerX = (int)(rect.X + rect.Width / 2);
            var centerY = (int)(rect.Y + rect.Height / 2);
            return Click(centerX, centerY, "left", 1);
        }
        catch (Exception ex)
        {
            return JsonResult.Failure($"Click failed: {ex.Message}");
        }
    }

    static JsonResult GetElementText(string? title, string? role, string? identifier)
    {
        var foregroundWindow = GetForegroundWindow();
        if (foregroundWindow == IntPtr.Zero)
        {
            return JsonResult.Failure("No foreground window");
        }

        var root = AutomationElement.FromHandle(foregroundWindow);
        var element = FindElement(root, title, role, identifier);

        if (element == null)
        {
            return JsonResult.Failure("Element not found");
        }

        try
        {
            string text = element.Current.Name;

            // Try value pattern
            if (element.TryGetCurrentPattern(ValuePattern.Pattern, out object? pattern))
            {
                text = ((ValuePattern)pattern).Current.Value;
            }
            // Try text pattern
            else if (element.TryGetCurrentPattern(TextPattern.Pattern, out pattern))
            {
                text = ((TextPattern)pattern).DocumentRange.GetText(-1);
            }

            return JsonResult.Success(new Dictionary<string, object> { ["text"] = text });
        }
        catch (Exception ex)
        {
            return JsonResult.Failure($"Get text failed: {ex.Message}");
        }
    }

    static JsonResult FocusElement(string? title, string? role, string? identifier)
    {
        var foregroundWindow = GetForegroundWindow();
        if (foregroundWindow == IntPtr.Zero)
        {
            return JsonResult.Failure("No foreground window");
        }

        var root = AutomationElement.FromHandle(foregroundWindow);
        var element = FindElement(root, title, role, identifier);

        if (element == null)
        {
            return JsonResult.Failure("Element not found");
        }

        try
        {
            element.SetFocus();
            return JsonResult.Success();
        }
        catch (Exception ex)
        {
            return JsonResult.Failure($"Focus failed: {ex.Message}");
        }
    }

    #endregion
}

class JsonResult
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Data { get; set; }

    [JsonPropertyName("error")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Error { get; set; }

    public static JsonResult Success(object? data = null) => new() { Success = true, Data = data };
    public static JsonResult Failure(string error) => new() { Success = false, Error = error };
}
