const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 8080;
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-3";
const TF_APP_DIR = path.resolve(__dirname, "..", "final");
const TF_DB_DIR = path.resolve(__dirname, "..", "selfservice-db");
const PUBLIC_DIR = path.join(__dirname, "public");

// Force MOCK_MODE if set, or auto-fallback if AWS/Terraform are not available
let isMockMode = process.env.MOCK_MODE === "true" || process.env.LOCAL_MODE === "true";
let isRunning = false;

// Simulated in-memory instance state for local demonstration
let mockState = {
  instances: [
    { id: "i-09f1c7d24a8e1b001", name: "app-ec2-1", state: "running" },
    { id: "i-09f1c7d24a8e1b002", name: "app-ec2-2", state: "running" }
  ],
  appApplied: true,
  dbApplied: true
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 500, { error: "Impossible de lire le fichier: " + path.basename(filePath) });
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, options);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        resolve({ code: -1, stdout: "", stderr: err.message });
      });

      child.on("close", (code) => {
        resolve({ code: code ?? 0, stdout, stderr });
      });
    } catch (e) {
      resolve({ code: -1, stdout: "", stderr: e.message });
    }
  });
}

async function getManagedInstancesState() {
  if (isMockMode) {
    const states = mockState.instances.map((i) => i.state);
    const hasRunning = states.includes("running");
    const hasStopped = states.includes("stopped");

    let mode = "none";
    if (hasRunning && hasStopped) mode = "mixed";
    else if (hasRunning) mode = "running";
    else if (hasStopped) mode = "stopped";

    return {
      ok: true,
      mode,
      states,
      showStart: mode === "stopped" || mode === "none",
      showStop: mode === "running" || mode === "mixed",
      simulated: true
    };
  }

  const stateResult = await runCommand(
    "aws",
    [
      "ec2",
      "describe-instances",
      "--region",
      AWS_REGION,
      "--filters",
      "Name=tag:Name,Values=app-ec2-1,app-ec2-2",
      "--query",
      "Reservations[].Instances[].State.Name",
      "--output",
      "json"
    ],
    { cwd: TF_APP_DIR }
  );

  if (stateResult.code !== 0) {
    console.warn("AWS CLI non disponible ou non configure. Activation du mode Simulation Locale.");
    isMockMode = true;
    return getManagedInstancesState();
  }

  let states = [];
  try {
    states = JSON.parse(stateResult.stdout || "[]");
  } catch (err) {
    return {
      ok: false,
      logs: `Impossible de parser la reponse AWS: ${err.message}\n\n${stateResult.stdout}`
    };
  }

  const hasRunning = states.includes("running");
  const hasStopped = states.includes("stopped");

  let mode = "none";
  if (hasRunning && hasStopped) mode = "mixed";
  else if (hasRunning) mode = "running";
  else if (hasStopped) mode = "stopped";

  return {
    ok: true,
    mode,
    states,
    showStart: mode === "stopped" || mode === "none",
    showStop: mode === "running" || mode === "mixed"
  };
}

function simulateTerraformLogs(action, target) {
  const timestamp = new Date().toISOString();
  if (action === "apply") {
    if (target === "selfservice-db") {
      return `[${timestamp}] [SIMULATION] terraform init -input=false
Initializing provider plugins...
- Finding openstack/openstack versions matching ">= 1.48.0"...
- Installing openstack/openstack v1.53.0...
Terraform has been successfully initialized!

[${timestamp}] [SIMULATION] terraform apply -auto-approve -input=false
openstack_compute_instance_v2.db1: Creating...
openstack_compute_instance_v2.db2: Creating...
openstack_compute_instance_v2.db1: Creation complete after 12s [id=db-inst-01]
openstack_compute_instance_v2.db2: Creation complete after 14s [id=db-inst-02]

Apply complete! Resources: 2 added, 0 changed, 0 destroyed.

Outputs:
db1_ip = "10.200.0.2"
db2_ip = "10.200.0.3"
status = "PostgreSQL cluster active and ready"`;
    }

    return `[${timestamp}] [SIMULATION] terraform init -input=false
Initializing modules...
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching ">= 5.0.0"...
- Installing hashicorp/aws v5.40.0...
Terraform has been successfully initialized!

[${timestamp}] [SIMULATION] terraform apply -auto-approve -input=false
data.aws_vpc.selected: Reading...
data.aws_lb.existing_alb: Reading...
aws_security_group.app_sg: Creating...
aws_security_group.app_sg: Creation complete after 3s [id=sg-0a4b2c8e19f3a]
aws_instance.app[0]: Creating... (tag: app-ec2-1)
aws_instance.app[1]: Creating... (tag: app-ec2-2)
aws_lb_target_group.app_tg: Creating...
aws_lb_target_group.app_tg: Creation complete after 4s [id=arn:aws:elasticloadbalancing:tg/app-arcl]
aws_lb_listener_rule.app_rule: Creating...
aws_lb_listener_rule.app_rule: Creation complete after 2s
aws_instance.app[0]: Still creating... [10s elapsed]
aws_instance.app[1]: Still creating... [10s elapsed]
aws_instance.app[0]: Provisioning with cloud-init (clone APP_ARCL, build React + Node backend, setup Nginx reverse proxy)
aws_instance.app[1]: Provisioning with cloud-init (clone APP_ARCL, build React + Node backend, setup Nginx reverse proxy)
aws_instance.app[0]: Creation complete after 24s [id=i-09f1c7d24a8e1b001]
aws_instance.app[1]: Creation complete after 26s [id=i-09f1c7d24a8e1b002]
aws_lb_target_group_attachment.app_attach[0]: Creating...
aws_lb_target_group_attachment.app_attach[1]: Creating...
aws_lb_target_group_attachment.app_attach[0]: Creation complete after 2s
aws_lb_target_group_attachment.app_attach[1]: Creation complete after 2s

Apply complete! Resources: 6 added, 0 changed, 0 destroyed.

Outputs:
alb_url = "http://TheUltimateLoadbalancer.eu-west-3.elb.amazonaws.com"
instance_public_ips = [
  "15.237.45.101",
  "15.237.45.102"
]`;
  } else {
    // Destroy
    if (target === "selfservice-db") {
      return `[${timestamp}] [SIMULATION] terraform destroy -auto-approve -input=false
openstack_compute_instance_v2.db1: Destroying... [id=db-inst-01]
openstack_compute_instance_v2.db2: Destroying... [id=db-inst-02]
openstack_compute_instance_v2.db1: Destruction complete after 8s
openstack_compute_instance_v2.db2: Destruction complete after 9s

Destroy complete! Resources: 2 destroyed.`;
    }

    return `[${timestamp}] [SIMULATION] terraform destroy -auto-approve -input=false
aws_lb_listener_rule.app_rule: Destroying...
aws_lb_target_group_attachment.app_attach[0]: Destroying...
aws_lb_target_group_attachment.app_attach[1]: Destroying...
aws_lb_target_group_attachment.app_attach[0]: Destruction complete after 2s
aws_lb_target_group_attachment.app_attach[1]: Destruction complete after 2s
aws_lb_target_group.app_tg: Destroying...
aws_instance.app[0]: Destroying... [id=i-09f1c7d24a8e1b001]
aws_instance.app[1]: Destroying... [id=i-09f1c7d24a8e1b002]
aws_lb_target_group.app_tg: Destruction complete after 3s
aws_instance.app[0]: Destruction complete after 15s
aws_instance.app[1]: Destruction complete after 16s
aws_security_group.app_sg: Destroying...
aws_security_group.app_sg: Destruction complete after 2s

Destroy complete! Resources: 6 destroyed.`;
  }
}

function runTerraformCommand(res, action, targetDir, label) {
  if (isRunning) {
    sendJson(res, 409, { error: "Une operation Terraform est deja en cours." });
    return;
  }

  isRunning = true;

  if (isMockMode) {
    setTimeout(() => {
      isRunning = false;
      const logs = simulateTerraformLogs(action, label);
      if (action === "apply") {
        if (label === "app") {
          mockState.instances.forEach((i) => (i.state = "running"));
          mockState.appApplied = true;
        } else {
          mockState.dbApplied = true;
        }
      } else {
        if (label === "app") {
          mockState.instances.forEach((i) => (i.state = "stopped"));
          mockState.appApplied = false;
        } else {
          mockState.dbApplied = false;
        }
      }

      sendJson(res, 200, {
        ok: true,
        step: action,
        target: label,
        exitCode: 0,
        logs
      });
    }, 1200);
    return;
  }

  const logs = [];
  const pushLog = (chunk) => logs.push(chunk.toString());

  const init = spawn("terraform", ["init", "-input=false"], { cwd: targetDir });
  init.stdout.on("data", pushLog);
  init.stderr.on("data", pushLog);

  init.on("error", (err) => {
    console.warn("Terraform introuvable, bascule en mode simulation.");
    isMockMode = true;
    isRunning = false;
    runTerraformCommand(res, action, targetDir, label);
  });

  init.on("close", (initCode) => {
    if (initCode !== 0) {
      isRunning = false;
      sendJson(res, 500, {
        ok: false,
        step: "init",
        exitCode: initCode,
        logs: logs.join("")
      });
      return;
    }

    const commandArgs =
      action === "destroy"
        ? ["destroy", "-auto-approve", "-input=false"]
        : ["apply", "-auto-approve", "-input=false"];

    const tfProcess = spawn("terraform", commandArgs, { cwd: targetDir });
    tfProcess.stdout.on("data", pushLog);
    tfProcess.stderr.on("data", pushLog);

    tfProcess.on("close", (tfCode) => {
      isRunning = false;
      sendJson(res, tfCode === 0 ? 200 : 500, {
        ok: tfCode === 0,
        step: action,
        target: label,
        exitCode: tfCode,
        logs: logs.join("")
      });
    });
  });
}

async function runInstancePowerAction(res, action) {
  if (isRunning) {
    sendJson(res, 409, { error: "Une operation est deja en cours." });
    return;
  }

  isRunning = true;
  const targetState = action === "start-instances" ? "stopped" : "running";
  const newState = action === "start-instances" ? "running" : "stopped";
  const commandLabel = action === "start-instances" ? "start" : "stop";

  if (isMockMode) {
    setTimeout(() => {
      isRunning = false;
      mockState.instances.forEach((inst) => {
        inst.state = newState;
      });
      const ids = mockState.instances.map((i) => i.id);
      sendJson(res, 200, {
        ok: true,
        step: commandLabel,
        exitCode: 0,
        logs:
          `[SIMULATION] Instances ciblees: ${ids.join(", ")}\n` +
          `Action: ec2 ${action} executee avec succes.\n` +
          `Nouvel etat des instances: ${newState}\n`
      });
    }, 800);
    return;
  }

  try {
    const listResult = await runCommand(
      "aws",
      [
        "ec2",
        "describe-instances",
        "--region",
        AWS_REGION,
        "--filters",
        "Name=tag:Name,Values=app-ec2-1,app-ec2-2",
        `Name=instance-state-name,Values=${targetState}`,
        "--query",
        "Reservations[].Instances[].InstanceId",
        "--output",
        "json"
      ],
      { cwd: TF_APP_DIR }
    );

    if (listResult.code !== 0) {
      console.warn("AWS CLI non disponible. Bascule en mode simulation.");
      isMockMode = true;
      isRunning = false;
      return runInstancePowerAction(res, action);
    }

    let instanceIds = [];
    try {
      instanceIds = JSON.parse(listResult.stdout || "[]");
    } catch (err) {
      sendJson(res, 500, {
        ok: false,
        step: "parse-instance-list",
        logs: `Impossible de parser la reponse AWS: ${err.message}\n\n${listResult.stdout}`
      });
      return;
    }

    if (instanceIds.length === 0) {
      sendJson(res, 200, {
        ok: true,
        step: commandLabel,
        logs: `Aucune instance a ${commandLabel === "start" ? "demarrer" : "arreter"}.\n`
      });
      return;
    }

    const powerResult = await runCommand(
      "aws",
      ["ec2", action, "--region", AWS_REGION, "--instance-ids", ...instanceIds],
      { cwd: TF_APP_DIR }
    );

    sendJson(res, powerResult.code === 0 ? 200 : 500, {
      ok: powerResult.code === 0,
      step: commandLabel,
      exitCode: powerResult.code,
      logs:
        `Instances ciblees: ${instanceIds.join(", ")}\n\n` +
        `${powerResult.stdout}\n${powerResult.stderr}`
    });
  } finally {
    isRunning = false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    serveFile(res, path.join(PUBLIC_DIR, "index.html"), "text/html; charset=utf-8");
    return;
  }

  if (req.method === "GET" && req.url === "/app.js") {
    serveFile(res, path.join(PUBLIC_DIR, "app.js"), "application/javascript; charset=utf-8");
    return;
  }

  if (req.method === "GET" && req.url === "/api/instance-state") {
    getManagedInstancesState()
      .then((result) => {
        if (!result.ok) {
          sendJson(res, 500, result);
          return;
        }
        sendJson(res, 200, result);
      })
      .catch((err) => {
        sendJson(res, 500, {
          ok: false,
          logs: `Erreur inattendue: ${err.message}`
        });
      });
    return;
  }

  if (req.method === "POST" && req.url === "/api/apply") {
    runTerraformCommand(res, "apply", TF_APP_DIR, "app");
    return;
  }

  if (req.method === "POST" && req.url === "/api/destroy") {
    runTerraformCommand(res, "destroy", TF_APP_DIR, "app");
    return;
  }

  if (req.method === "POST" && req.url === "/api/db/apply") {
    runTerraformCommand(res, "apply", TF_DB_DIR, "selfservice-db");
    return;
  }

  if (req.method === "POST" && req.url === "/api/db/destroy") {
    runTerraformCommand(res, "destroy", TF_DB_DIR, "selfservice-db");
    return;
  }

  if (req.method === "POST" && req.url === "/api/start-instances") {
    runInstancePowerAction(res, "start-instances");
    return;
  }

  if (req.method === "POST" && req.url === "/api/stop-instances") {
    runInstancePowerAction(res, "stop-instances");
    return;
  }

  sendJson(res, 404, { error: "Route introuvable." });
});

server.listen(PORT, () => {
  console.log(`Terraform runner UI demarre sur http://localhost:${PORT}`);
  if (isMockMode) {
    console.log("Mode: Simulation Locale (MOCK_MODE actif)");
  } else {
    console.log("Mode: AWS/Terraform direct (avec fallback automatique si indisponible)");
  }
});
