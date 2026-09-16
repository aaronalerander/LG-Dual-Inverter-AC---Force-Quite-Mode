const LG_BASE_URL = "https://api-aic.lgthinq.com";
const QUITE_MODE_SET_TEMPERATURE = 22;

async function lgRequest(env, path, options = {}) {
  const response = await fetch(`${LG_BASE_URL}${path}`, {
    ...options,

    headers: {
      Authorization: `Bearer ${env.LG_TOKEN}`,
      "x-country": env.LG_COUNTRY,
      "x-client-id": env.LG_CLIENT_ID,
      "x-api-key": env.LG_API_KEY,
      "x-service-phase": "OP",
      "x-message-id": crypto.randomUUID(),

      ...options.headers,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`LG API ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : {};
}

async function getState(env) {
  const result = await lgRequest(env, `/devices/${env.LG_DEVICE_ID}/state`);

  return result.response;
}

async function control(env, payload) {
  return lgRequest(env, `/devices/${env.LG_DEVICE_ID}/control`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-conditional-control": "true",
    },

    body: JSON.stringify(payload),
  });
}

async function enforceQuietMode(env) {
  const state = await getState(env);

  // You manually turned the AC off.
  // Don't turn it back on.
  if (state.operation?.airConOperationMode !== "POWER_ON") {
    console.log("AC is off; doing nothing");
    return;
  }

  // Only enforce quiet when in cool mode
  const mode = state.airConJobMode?.currentJobMode;

  const sleep = state.sleepTimer ?? {};

  const windStrength = state.airFlow?.windStrength;

  const remainingSleepMinutes =
    (sleep.relativeHourToStop ?? 0) * 60 + (sleep.relativeMinuteToStop ?? 0);

  const targetTemperature = state.temperature?.targetTemperature;

  if (!["COOL"].includes(mode)) {
    console.log(`AC is in ${mode}; doing nothing`);
    return;
  }

  // LOW = automation enabled.
  //
  // MEDIUM/HIGH = manual override.
  // Leave the AC completely alone.
  if (windStrength !== "LOW") {
    console.log(`Fan is ${windStrength}; manual override`);
    return;
  }

  // Make sure Sleep is active.
  //
  // Renew with an hour left so the 12-hour sleep
  // timer never actually shuts the AC off.
  //
  if (sleep.relativeStopTimer !== "SET" || remainingSleepMinutes < 60) {
    console.log("Enabling/renewing Sleep");

    await control(env, {
      sleepTimer: {
        relativeHourToStop: 12,
        relativeMinuteToStop: 0,
      },
    });
  }

  //
  // Sleep periodically raises the set temperature.
  // Force it back to QUITE_MODE_SET_TEMPERATURE C.
  //
  if (targetTemperature !== QUITE_MODE_SET_TEMPERATURE) {
    console.log(
      `Temperature is ${targetTemperature}; resetting to ${QUITE_MODE_SET_TEMPERATURE}`,
    );

    await control(env, {
      temperature: {
        targetTemperature: QUITE_MODE_SET_TEMPERATURE,
      },
    });
  }

  console.log("Quiet-mode check complete");
}

export default {
  async scheduled(controller, env, ctx) {
    try {
      await enforceQuietMode(env);
    } catch (error) {
      // IMPORTANT:
      // Don't retry aggressively if LG rejects us.
      console.error("Quiet-mode check failed:", error);
    }
  },
};
