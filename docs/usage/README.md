# Usage

1. Download **blinksocks-desktop-[platform]-[arch]-[version].tar.gz** for your platform and architecture.
2. Decompress it to anywhere you can access to.
3. Double-Click **blinksocks-desktop.exe**(Windows), **blinksocks-desktop.app**(macOS), **blinksocks-desktop**(Linux).

## Notice

Although blinksocks is cross-platform, but there are still some differences you need to concern among platforms.

On Windows and macOS, system proxy including **HTTP/Socks5 Proxy** and **Proxy Auto Config(PAC)** are managed automatically by
blinksocks-desktop.

On Linux, there is no system-wide approach to manage system proxy among different distributions. So you must config them
manually.

### Windows

All things should work well normally.

### macOS

Manage system settings requires **root** privilege, blinksocks-desktop will ask for credentials once you start
**blinksocks-desktop.app**, if credentials is invalid, it will fallback to manual mode.

Also, **Node.js** must be installed due to the complex design of sudo-agent, please follow the official
[guide](https://nodejs.org/en/download/) to install Node.js on macOS.

If no **node** command found, blinksocks-desktop will fallback to manual mode.

### Linux

You should set system proxy or browser proxy manually.
