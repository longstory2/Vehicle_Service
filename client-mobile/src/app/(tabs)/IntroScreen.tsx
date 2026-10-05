import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#F5F7F2",
  forest: "#163F2D",
  forestDark: "#0E2E24",
  green: "#4F9A68",
  lime: "#D6F278",
  mint: "#B7E7C7",
  white: "#FFFFFF",
  ink: "#1E2B22",
  muted: "#5E7168",
};

const ServiceIllustration = () => {
  return (
    <View style={styles.illustration}>
      <View style={styles.sun} />
      <View style={styles.orbit} />

      <View style={styles.locationBadge}>
        <View style={styles.locationDot} />
        <Text style={styles.locationText}>TẬN NƠI</Text>
      </View>

      <View style={styles.ratingBadge}>
        <Text style={styles.ratingStar}>★</Text>
        <Text style={styles.ratingText}>4.9</Text>
        <Text style={styles.ratingCaption}>/5</Text>
      </View>

      <View style={styles.road}>
        <View style={styles.roadMark} />
        <View style={[styles.roadMark, styles.roadMarkMiddle]} />
        <View style={[styles.roadMark, styles.roadMarkEnd]} />
      </View>

      <View style={styles.car}>
        <View style={styles.carRoof}>
          <View style={styles.carWindow} />
          <View style={[styles.carWindow, styles.carWindowRight]} />
        </View>
        <View style={styles.carBody}>
          <View style={styles.carLight} />
          <View style={styles.carGrille} />
        </View>
      </View>

      <View style={[styles.wheel, styles.wheelLeft]}>
        <View style={styles.wheelHub} />
      </View>
      <View style={[styles.wheel, styles.wheelRight]}>
        <View style={styles.wheelHub} />
      </View>

      <View style={styles.technician}>
        <View style={styles.technicianHead} />
        <View style={styles.technicianBody}>
          <View style={styles.technicianStripe} />
        </View>
        <View style={styles.toolBag}>
          <View style={styles.toolBagHandle} />
        </View>
      </View>

      <View style={styles.sparkleOne} />
      <View style={styles.sparkleTwo} />
      <Text style={styles.illustrationCaption}>THIẾT LẬP BẢO DƯỠNG</Text>
    </View>
  );
};

const IntroScreen = () => {
  return (
		<SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
			<StatusBar style="dark" />
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<View style={styles.brand}>
						<View style={styles.brandMark}>
							<View style={styles.brandWheel} />
							<View style={styles.brandRoad} />
						</View>
						<Text style={styles.brandName}>Xe Nhà</Text>
					</View>
					<Text style={styles.headerLabel}>CHĂM XE TẠI NHÀ</Text>
				</View>

				<ServiceIllustration />

				<View style={styles.copy}>
					<Text style={styles.eyebrow}>DỊCH VỤ SỬA CHỮA & BẢO DƯỠNG</Text>
					<Text style={styles.title}>
						Chăm xe tận nơi,{"\n"}
						<Text style={styles.titleAccent}>nhẹ lòng mọi chuyến đi.</Text>
					</Text>
					<Text style={styles.description}>
						Kết nối bạn với kỹ thuật viên phù hợp, đến tận nơi khi xe cần được
						chăm sóc.
					</Text>
				</View>

				<ActivityIndicator color={colors.ink} size={90}/>
			</ScrollView>
		</SafeAreaView>
  )
}
const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: 10,
		paddingBottom: 20,
		alignItems: "center",
	},
	header: {
		width: "100%",
		maxWidth: 440,
		minHeight: 46,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 18,
	},
	brand: {
		flexDirection: "row",
		alignItems: "center",
		gap: 9,
	},
	brandMark: {
		width: 34,
		height: 34,
		borderRadius: 12,
		backgroundColor: colors.forest,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	brandWheel: {
		position: "absolute",
		width: 22,
		height: 11,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: colors.lime,
		bottom: 8,
	},
	brandRoad: {
		position: "absolute",
		height: 2,
		width: 12,
		backgroundColor: colors.white,
		top: 8,
		left: 11,
		transform: [{ rotate: "-35deg" }],
	},
	brandName: {
		color: colors.forest,
		fontSize: 20,
		fontWeight: "800",
	},
	headerLabel: {
		color: colors.green,
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 0.8,
	},
	illustration: {
		width: "100%",
		maxWidth: 440,
		height: 286,
		backgroundColor: colors.forest,
		borderRadius: 24,
		overflow: "hidden",
		position: "relative",
	},
	sun: {
		position: "absolute",
		width: 174,
		height: 174,
		borderRadius: 87,
		backgroundColor: "#26734F",
		top: 21,
		right: 53,
	},
	orbit: {
		position: "absolute",
		width: 218,
		height: 218,
		borderRadius: 109,
		borderWidth: 1,
		borderColor: "rgba(214, 242, 120, 0.28)",
		top: 0,
		right: 30,
	},
	locationBadge: {
		position: "absolute",
		zIndex: 3,
		top: 21,
		left: 18,
		height: 34,
		paddingHorizontal: 11,
		borderRadius: 17,
		backgroundColor: colors.white,
		flexDirection: "row",
		alignItems: "center",
		gap: 7,
	},
	locationDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: colors.green,
	},
	locationText: {
		color: colors.forest,
		fontSize: 9,
		fontWeight: "800",
		letterSpacing: 0.5,
	},
	ratingBadge: {
		position: "absolute",
		zIndex: 3,
		top: 75,
		right: 15,
		minWidth: 101,
		paddingVertical: 9,
		paddingHorizontal: 10,
		borderRadius: 12,
		backgroundColor: colors.white,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	ratingStar: {
		color: "#E8A63B",
		fontSize: 13,
	},
	ratingText: {
		color: colors.ink,
		fontSize: 12,
		fontWeight: "800",
	},
	ratingCaption: {
		color: colors.muted,
		fontSize: 9,
	},
	road: {
		position: "absolute",
		height: 77,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: colors.forestDark,
	},
	roadMark: {
		position: "absolute",
		height: 3,
		width: 34,
		borderRadius: 2,
		backgroundColor: "rgba(214, 242, 120, 0.72)",
		left: "12%",
		top: 40,
	},
	roadMarkMiddle: {
		left: "44%",
	},
	roadMarkEnd: {
		left: "76%",
	},
	car: {
		position: "absolute",
		zIndex: 2,
		width: "65%",
		height: 94,
		bottom: 34,
		left: "13%",
	},
	carRoof: {
		position: "absolute",
		width: "62%",
		height: 48,
		top: 0,
		left: "19%",
		borderTopLeftRadius: 47,
		borderTopRightRadius: 38,
		backgroundColor: colors.white,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 4,
		paddingTop: 10,
	},
	carWindow: {
		width: "40%",
		height: 24,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 4,
		backgroundColor: "#94CDB0",
	},
	carWindowRight: {
		borderTopLeftRadius: 4,
		borderTopRightRadius: 16,
	},
	carBody: {
		position: "absolute",
		bottom: 13,
		width: "100%",
		height: 48,
		borderRadius: 19,
		backgroundColor: colors.white,
		justifyContent: "center",
		alignItems: "flex-end",
		paddingHorizontal: 8,
	},
	carLight: {
		position: "absolute",
		right: 0,
		width: 9,
		height: 17,
		borderTopLeftRadius: 6,
		borderBottomLeftRadius: 6,
		backgroundColor: colors.lime,
	},
	carGrille: {
		width: 19,
		height: 19,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: "#BDD9C5",
		marginRight: 5,
	},
	wheel: {
		position: "absolute",
		zIndex: 2,
		width: 31,
		height: 31,
		bottom: 0,
		borderRadius: 16,
		backgroundColor: colors.forestDark,
		alignItems: "center",
		justifyContent: "center",
	},
	wheelLeft: {
		left: "15%",
	},
	wheelRight: {
		right: "15%",
	},
	wheelHub: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: colors.lime,
	},
	technician: {
		position: "absolute",
		zIndex: 2,
		width: 59,
		height: 107,
		right: "10%",
		bottom: 35,
		alignItems: "center",
	},
	technicianHead: {
		width: 25,
		height: 25,
		borderRadius: 13,
		backgroundColor: "#F2C39A",
		borderWidth: 4,
		borderColor: colors.lime,
	},
	technicianBody: {
		width: 39,
		height: 50,
		borderTopLeftRadius: 15,
		borderTopRightRadius: 15,
		backgroundColor: "#F0F7ED",
		marginTop: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	technicianStripe: {
		height: 6,
		width: 30,
		borderRadius: 3,
		backgroundColor: colors.green,
	},
	toolBag: {
		position: "absolute",
		bottom: 4,
		right: -2,
		width: 25,
		height: 21,
		borderRadius: 5,
		backgroundColor: colors.lime,
	},
	toolBagHandle: {
		position: "absolute",
		width: 11,
		height: 6,
		borderWidth: 2,
		borderBottomWidth: 0,
		borderColor: colors.forestDark,
		borderTopLeftRadius: 5,
		borderTopRightRadius: 5,
		top: -4,
		left: 7,
	},
	sparkleOne: {
		position: "absolute",
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: colors.lime,
		top: 76,
		left: "48%",
	},
	sparkleTwo: {
		position: "absolute",
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.mint,
		top: 119,
		left: "59%",
	},
	illustrationCaption: {
		position: "absolute",
		bottom: 11,
		alignSelf: "center",
		color: "rgba(255,255,255,0.72)",
		fontSize: 8,
		fontWeight: "800",
		letterSpacing: 2,
	},
	copy: {
		width: "100%",
		maxWidth: 440,
		marginTop: 26,
	},
	eyebrow: {
		color: colors.green,
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.2,
		marginBottom: 9,
	},
	title: {
		color: colors.ink,
		fontSize: 30,
		lineHeight: 37,
		fontWeight: "800",
	},
	titleAccent: {
		color: colors.green,
	},
	description: {
		color: colors.muted,
		fontSize: 14,
		lineHeight: 21,
		marginTop: 10,
		maxWidth: 360,
	},
	actions: {
		width: "100%",
		maxWidth: 440,
		marginTop: 21,
	},
	primaryButton: {
		minHeight: 54,
		paddingHorizontal: 20,
		borderRadius: 14,
		backgroundColor: colors.forest,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		color: colors.white,
		fontSize: 15,
		fontWeight: "700",
	},
	buttonArrow: {
		position: "absolute",
		right: 19,
		color: colors.lime,
		fontSize: 21,
		lineHeight: 24,
	},
	signupRow: {
		minHeight: 42,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
	},
	signupHint: {
		color: colors.muted,
		fontSize: 13,
	},
	signupLink: {
		color: colors.green,
		fontSize: 13,
		fontWeight: "800",
	},
	footer: {
		width: "100%",
		maxWidth: 440,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		marginTop: "auto",
		paddingTop: 12,
	},
	footerLine: {
		flex: 1,
		height: 1,
		backgroundColor: "#DCE6DD",
	},
	footerText: {
		color: "#78877C",
		fontSize: 8,
		fontWeight: "700",
		letterSpacing: 0.9,
	},
});
export default IntroScreen