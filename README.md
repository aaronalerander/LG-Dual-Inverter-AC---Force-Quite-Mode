# LG-Dual-Inverter-AC---Force-Quite-Mode
Force your LG Dual Inverter AC into quite mode. 

It turns out the LG Dual Inverter ACs have an ultra quite fan speed mode when the device is set to sleep mode. However, sleep mode increases the set tempreture by 2 degrees over a 1 hour period. This script polls the ac status and sets the temperature back to 22 degrees celsius after the temp increases while enforcing that sleep mode stays on. 

Deployed to a cloud flare cron, polling every 5 minutes. 
