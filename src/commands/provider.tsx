import { ProviderWizard } from "../components/ProviderWizard";
import type { Command } from "../types";
import { setActiveProvider } from "../utils/providers";

const command = {
  type: "local",
  name: "provider",
  description: "Manage AI providers",
  isEnabled: true,
  isHidden: false,
  subcommands: [
    { name: "list", description: "List providers" },
    { name: "add", description: "Add a provider" },
    { name: "remove", description: "Remove a provider" },
    { name: "use", description: "Switch provider" },
  ],
  userFacingName() {
    return "provider";
  },
  async call(args: string, { renderComponent }) {
    const sub = args.trim().split(" ")[0];

    if (!sub || sub === "list") {
      // openWizard("list");
      renderComponent(
        <ProviderWizard
          mode="list"
          onDone={(msg) => renderComponent(null, msg)}
        />,
      );
      return;
    }
    if (sub === "add") {
      // openWizard("add");
      renderComponent(
        <ProviderWizard
          mode="add"
          onDone={(msg) => renderComponent(null, msg)}
        />,
      );
      return;
    }
    if (sub === "remove") {
      // openWizard("remove");
      renderComponent(
        <ProviderWizard
          mode="remove"
          onDone={(msg) => renderComponent(null, msg)}
        />,
      );
      return;
    }
    if (sub === "use") {
      const name = args.trim().split(" ")[1];
      if (!name) {
        // openWizard("list");
        renderComponent(
          <ProviderWizard
            mode="list"
            onDone={(msg) => renderComponent(null, msg)}
          />,
        );
        return;
      }
      try {
        await setActiveProvider(name);
        return `switched to "${name}" 🫡`;
      } catch (e) {
        return `error: ${(e as Error).message}`;
      }
    }

    return `usage: /provider | /provider add | /provider remove | /provider use <name>`;
  },
} satisfies Command;

export default command;
