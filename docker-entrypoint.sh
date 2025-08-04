#!/bin/sh
set -e

# Configure proxy if PROXY_URL is set
if [ -n "$PROXY_URL" ]; then
    export HOSTNAME="0.0.0.0"
    
    # Parse proxy URL safely
    protocol=$(echo "$PROXY_URL" | cut -d: -f1)
    host=$(echo "$PROXY_URL" | cut -d/ -f3 | cut -d: -f1)
    port=$(echo "$PROXY_URL" | cut -d: -f3)
    
    # Create proxychains configuration in user-writable location
    conf=/tmp/proxychains.conf
    {
        echo "strict_chain"
        echo "proxy_dns"
        echo "remote_dns_subnet 224"
        echo "tcp_read_time_out 15000"
        echo "tcp_connect_time_out 8000"
        echo "localnet 127.0.0.0/255.0.0.0"
        echo "localnet ::1/128"
        echo "[ProxyList]"
        echo "$protocol $host $port"
    } > "$conf"
    
    echo "Proxy configured. Starting with proxychains..."
    exec proxychains -f "$conf" node server.js
else
    echo "Starting without proxy..."
    exec node server.js
fi