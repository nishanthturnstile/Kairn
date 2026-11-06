import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useQuery } from "@tanstack/react-query";
import { readApiUrl, systemQuery } from "../data/system-query";

const connection = readApiUrl(process.env.EXPO_PUBLIC_API_URL);

function ServiceStatus({ baseUrl }: { baseUrl: string }) {
  const status = useQuery(systemQuery(baseUrl));
  return (
    <View style={styles.section}>
      <Text selectable style={styles.label}>
        {baseUrl}
      </Text>
      <View accessibilityLiveRegion="polite" style={styles.section}>
        {status.data ? (
          <>
            <Text selectable style={styles.connected}>
              Connected
            </Text>
            <Text selectable style={styles.body}>
              Contract {status.data.contractVersion} · Sync protocol{" "}
              {status.data.syncProtocolVersion}
            </Text>
          </>
        ) : (
          <Text style={styles.body}>
            {status.isFetching ? "Checking the service…" : "No connection yet."}
          </Text>
        )}
        {status.isError && (
          <Text selectable style={styles.error}>
            {status.data
              ? "Refresh failed. Showing the last successful response."
              : "Could not reach the service. Check the connection and try again."}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check service connection"
        accessibilityState={{ disabled: status.isFetching }}
        disabled={status.isFetching}
        onPress={() => void status.refetch()}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          status.isFetching && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>{status.isFetching ? "Checking…" : "Check again"}</Text>
      </Pressable>
    </View>
  );
}

function selectDensityStyles(compact: boolean) {
  // Keep the Babel-generated variant scope out of React Refresh's stateful component signature.
  styles.useVariants({ density: compact ? "compact" : "comfortable" });
  return styles;
}

export default function StatusScreen() {
  const [compact, setCompact] = useState(false);
  const densityStyles = selectDensityStyles(compact);
  return (
    <ScrollView style={densityStyles.screen} contentInsetAdjustmentBehavior="automatic">
      <View style={densityStyles.page}>
        <Text style={densityStyles.eyebrow}>DEVELOPMENT BUILD</Text>
        <Text accessibilityRole="header" style={densityStyles.title}>
          Service connection
        </Text>
        <Text style={densityStyles.body}>
          A small check that this device and your server can talk.
        </Text>
        <View style={densityStyles.card}>
          {connection.baseUrl ? (
            <ServiceStatus baseUrl={connection.baseUrl} />
          ) : (
            <Text selectable style={densityStyles.body}>
              {connection.error}
            </Text>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compact spacing"
          accessibilityState={{ selected: compact }}
          onPress={() => setCompact((value) => !value)}
          style={({ pressed }) => [densityStyles.secondaryButton, pressed && densityStyles.pressed]}
        >
          <Text style={densityStyles.secondaryButtonText}>
            {compact ? "Use comfortable spacing" : "Use compact spacing"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme, runtime) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: { compact: theme.spacing.lg, medium: theme.spacing.xxl },
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + runtime.insets.bottom,
  },
  section: { gap: theme.spacing.md },
  eyebrow: { ...theme.typography.label, color: theme.colors.secondaryText, letterSpacing: 1 },
  title: { ...theme.typography.pageTitle, color: theme.colors.text, fontWeight: "600" },
  body: { ...theme.typography.body, color: theme.colors.text },
  label: { ...theme.typography.compactBody, color: theme.colors.secondaryText },
  connected: { ...theme.typography.sectionTitle, color: theme.colors.primary, fontWeight: "600" },
  error: { ...theme.typography.body, color: theme.colors.error },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.medium,
    variants: {
      density: {
        comfortable: { padding: theme.spacing.xl },
        compact: { padding: theme.spacing.md },
      },
    },
  },
  button: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.small,
    backgroundColor: theme.colors.primary,
  },
  buttonText: { ...theme.typography.body, fontWeight: "600", color: theme.colors.primaryText },
  secondaryButton: {
    minHeight: 48,
    padding: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.small,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  secondaryButtonText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: "500" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
}));
