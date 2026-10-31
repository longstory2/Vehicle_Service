import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

export type InfoRow = {
    label: string;
    value: string;
};

type InfoSectionProps = {
    title: string;
    rows: InfoRow[];
    variant?: "default" | "customer";
    icon?: ImageSourcePropType;
};

const InfoSection = ({ title, rows, variant = "default", icon }: InfoSectionProps) => {
    if (variant === "customer") {
        return (
            <View style={styles.customerSection}>
                <View style={styles.customerTitleRow}>
                    {icon ? <Image source={icon} style={styles.customerIcon} resizeMode="contain" /> : null}
                    <Text style={styles.customerTitle}>{title}</Text>
                </View>
                {rows.map((row) => (
                    <View key={row.label} style={styles.customerRow}>
                        <Text style={styles.customerLabel}>{row.label}</Text>
                        <Text style={styles.customerValue}>{row.value}</Text>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View className="pb-3">
            <Text className="mb-2 text-lg font-bold text-[#111111]">{title}</Text>
            {rows.map((row) => (
                <View key={row.label} className="min-h-[30px] flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-[15px] font-semibold text-[#858585]">{row.label}</Text>
                    <Text className="flex-1 text-right text-[15px] font-bold text-[#111111]">{row.value}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    customerSection: {
        paddingBottom: 12,
    },
    customerTitle: {
        color: "#111111",
        fontSize: 18,
        fontWeight: "700",
    },
    customerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    customerIcon: {
        width: 24,
        height: 24,
    },
    customerRow: {
        minHeight: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    customerLabel: {
        flex: 1,
        color: "#858585",
        fontSize: 15,
        fontWeight: "600",
    },
    customerValue: {
        flex: 1,
        color: "#111111",
        fontSize: 15,
        fontWeight: "700",
        textAlign: "right",
    },
});

export default InfoSection;
