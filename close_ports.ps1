$ports = @(3000, 3001, 3002) # Add your ports here

foreach ($port in $ports) {
    $pids = netstat -ano | Select-String ":$port" | ForEach-Object { $_.Line.Split()[-1] }
    foreach ($pid in $pids) {
        Stop-Process -Id $pid -Force
    }
}
