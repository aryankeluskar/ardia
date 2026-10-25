import { Symbol } from "@ardia/shell";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { stopCliControl, useCli } from "../lib/cliControl";
import { useTheme } from "../lib/theme";
import { stopUserScripts, useUserScripts } from "../lib/userScripts";
import { useBrowser } from "../store/browser";
import { PromptButton } from "./layout/controls";
import { useHover } from "./primitives";

const BAR_HEIGHT = 38;

type Shown = "controlling" | "controllingAndScripts" | "control" | "controlAndScripts" | "scripts";

const BAR_WORDS: Record<Shown, [string, string]> = {
  controlling: ["The ardia command", " is controlling Ardia"],
  controllingAndScripts: ["The ardia command", " is controlling Ardia, and Ardia Scripts are running"],
  control: ["The ardia command", " can control Ardia"],
  controlAndScripts: ["The ardia command", " can control Ardia, and Ardia Scripts are running"],
  scripts: ["Ardia Scripts", " are running"],
};

const PILL_WORDS: Record<Shown, [string, string]> = {
  controlling: ["ardia", " is controlling Ardia"],
  controllingAndScripts: ["ardia", " is controlling Ardia, and Ardia Scripts are running"],
  control: ["ardia", " can control Ardia"],
  controlAndScripts: ["ardia", " can control Ardia, and Ardia Scripts are running"],
  scripts: ["Ardia Scripts", " are running"],
};

const useShown = (): Shown | null => {
  const controlling = useCli((s) => s.server?.state === "on" && (s.server.connections ?? 0) > 0);
  const control = useBrowser((s) => s.settings.cliControl ?? false);
  const scripts = useUserScripts((s) => s.active);
  if (controlling) return scripts ? "controllingAndScripts" : "controlling";
  if (control) return scripts ? "controlAndScripts" : "control";
  return scripts ? "scripts" : null;
};

const stopAll = () => {
  const scripts = useUserScripts.getState().active;
  stopCliControl();
  if (scripts) void stopUserScripts();
};

export function CliControlBar() {
  const shown = useShown();
  const visible = shown !== null;
  const last = useRef<Shown>(shown ?? "controlling");
  if (shown) last.current = shown;
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);
  if (!mounted && !visible) return null;
  return <ShownCliControlBar visible={visible} shown={last.current} onHidden={() => setMounted(false)} />;
}

function ShownCliControlBar({ visible, shown, onHidden }: { visible: boolean; shown: Shown; onHidden: () => void }) {
  const [lead, rest] = BAR_WORDS[shown];
  const theme = useTheme();
  const height = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(height, { toValue: visible ? BAR_HEIGHT : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(
      ({ finished }) => finished && !visible && onHidden(),
    );
  }, [visible]);
  return (
    <Animated.View style={{ height, overflow: "hidden" }}>
      <View
        accessibilityRole="alert"
        accessibilityLabel={lead + rest}
        style={{
          height: BAR_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingLeft: 12,
          paddingRight: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.textPrimary, alignItems: "center", justifyContent: "center" }}>
          <Symbol name="terminal.fill" size={9} weight="bold" color={theme.dark ? "#000000" : "#FFFFFF"} style={{ width: 14, height: 14 }} />
        </View>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: theme.textSecondary }}>
          <Text style={{ fontWeight: "600", color: theme.textPrimary }}>{lead}</Text>
          {rest}
        </Text>
        <PromptButton title="Stop" onPress={stopAll} />
      </View>
    </Animated.View>
  );
}

export function CliControlPill() {
  const shown = useShown();
  if (!shown) return null;
  const [lead, rest] = PILL_WORDS[shown];
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 12, left: 0, right: 0, alignItems: "center" }}>
      <View
        accessibilityRole="alert"
        accessibilityLabel={lead + rest}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          height: 32,
          paddingLeft: 12,
          paddingRight: 4,
          borderRadius: 16,
          backgroundColor: "rgba(20,20,20,0.82)",
          borderWidth: 0.5,
          borderColor: "rgba(255,255,255,0.16)",
        }}
      >
        <Symbol name="terminal.fill" size={10} weight="semibold" color="#FFFFFF" style={{ width: 14, height: 14 }} />
        <Text numberOfLines={1} style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
          <Text style={{ fontWeight: "600", color: "#FFFFFF" }}>{lead}</Text>
          {rest}
        </Text>
        <StopPill />
      </View>
    </View>
  );
}

function StopPill() {
  const { hovered, hoverProps } = useHover();
  return (
    <View {...hoverProps}>
      <Pressable onPress={stopAll} accessibilityRole="button" accessibilityLabel="Stop">
        {({ pressed }) => (
          <View
            style={{
              height: 24,
              paddingHorizontal: 10,
              borderRadius: 12,
              justifyContent: "center",
              backgroundColor: hovered ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.16)",
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>Stop</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
