# LG-Dual-Inverter-AC---Force-Quite-Mode
Force your LG Dual Inverter AC into quite mode. 

It turns out the LG Dual Inverter ACs have an ultry quite fan speed mode when set to sleep mode. However, sleep mode increases the set tempreture by 2 degrees over an hour period. This script polls the ac status and sets the temp back to the original set tempreture after the temp changes while keeping sleep mode on. 

Deployed to cloud flare cron, running every 5 minutes. 
