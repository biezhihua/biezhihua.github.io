---
title: 爱快安装OPENWRT纯净版
tags:
---

opkg install coreutils-nohup
opkg install bash
opkg install iptables
opkg install dnsmasq-full
opkg install curl
opkg install jsonfilter
opkg install ca-certificates
opkg install ipset
opkg install ip-full
opkg install iptables-mod-tproxy
opkg install iptables-mod-extra
opkg install libcap
opkg install libcap-bin
opkg install ruby
opkg install ruby-yaml


root@OpenWrt:~# opkg install dnsmasq-full
Installing dnsmasq-full (2.80-16.3) to root...
Downloading http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/base/dnsmasq-full_2.80-16.3_x86_64.ipk
Collected errors:
 * check_data_file_clashes: Package dnsmasq-full wants to install file /etc/hotplug.d/ntp/25-dnsmasqsec
	But that file is already provided by package  * dnsmasq
 * check_data_file_clashes: Package dnsmasq-full wants to install file /etc/init.d/dnsmasq
	But that file is already provided by package  * dnsmasq
 * check_data_file_clashes: Package dnsmasq-full wants to install file /usr/lib/dnsmasq/dhcp-script.sh
	But that file is already provided by package  * dnsmasq
 * check_data_file_clashes: Package dnsmasq-full wants to install file /usr/sbin/dnsmasq
	But that file is already provided by package  * dnsmasq
 * check_data_file_clashes: Package dnsmasq-full wants to install file /usr/share/acl.d/dnsmasq_acl.json
	But that file is already provided by package  * dnsmasq
 * check_data_file_clashes: Package dnsmasq-full wants to install file /usr/share/dnsmasq/dhcpbogushostname.conf
	But that file is already provided by package  * dnsmasq
 * check_data_file_clashes: Package dnsmasq-full wants to install file /usr/share/dnsmasq/rfc6761.conf
	But that file is already provided by package  * dnsmasq
 * opkg_install_cmd: Cannot install package dnsmasq-full.

https://gitmemory.com/issue/vernesong/OpenClash/1050/736211032

src/gz openwrt_core http://downloads.openwrt.org/releases/19.07.7/targets/x86/64/packages
src/gz openwrt_base http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/base
src/gz openwrt_freifunk http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/freifunk
src/gz openwrt_luci http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/luci
src/gz openwrt_packages http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/packages
src/gz openwrt_routing http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/routing
src/gz openwrt_telephony http://downloads.openwrt.org/releases/19.07.7/packages/x86_64/telephony

src/gz openwrt_core http://downloads.openwrt.org/releases/19.07.3/targets/x86/64/packages
src/gz openwrt_base http://downloads.openwrt.org/releases/19.07.3/packages/x86_64/base
src/gz openwrt_freifunk http://downloads.openwrt.org/releases/19.07.3/packages/x86_64/freifunk
src/gz openwrt_luci http://downloads.openwrt.org/releases/19.07.3/packages/x86_64/luci
src/gz openwrt_packages http://downloads.openwrt.org/releases/19.07.3/packages/x86_64/packages
src/gz openwrt_routing http://downloads.openwrt.org/releases/19.07.3/packages/x86_64/routing
src/gz openwrt_telephony http://downloads.openwrt.org/releases/19.07.3/packages/x86_64/telephony

src/gz openwrt_core https://downloads.openwrt.org/snapshots/targets/x86/64/packages
src/gz openwrt_base https://downloads.openwrt.org/snapshots/packages/x86_64/base
src/gz openwrt_luci https://downloads.openwrt.org/snapshots/packages/x86_64/luci
src/gz openwrt_packages https://downloads.openwrt.org/snapshots/packages/x86_64/packages
src/gz openwrt_routing https://downloads.openwrt.org/snapshots/packages/x86_64/routing
src/gz openwrt_telephony https://downloads.openwrt.org/snapshots/packages/x86_64/telephony

https://openwrt.org/zh/downloads
https://github.com/vernesong/OpenClash/issues/839

libustream

https://www.baidu.com/link?url=0lzk6gn_MJrdylhu58pXMqiRgUfPW8RD6Bwtu6goyT8T_a7Bx9LV0McEebDw9GqW7t1ZirAOoReyspvgnH3JBK&wd=&eqid=c07b161800001671000000026072ac94
https://www.right.com.cn/forum/thread-3695541-1-1.html