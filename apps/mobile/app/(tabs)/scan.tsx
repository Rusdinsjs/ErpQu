import { CameraView, useCameraPermissions, BarcodeType } from 'expo-camera';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Vibration, Platform } from 'react-native';
import { Text, Button, useTheme, Surface, SegmentedButtons, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { assetApi } from '../../api/assets';
import { inventoryApi } from '../../api/inventory';

const SUPPORTED_BARCODES: BarcodeType[] = ['qr', 'code128', 'ean13', 'code39'];

export default function ScanScreen() {
    const theme = useTheme();
    const router = useRouter();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanMode, setScanMode] = useState<'asset' | 'inventory'>('asset');
    const [torch, setTorch] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    // Request Location Permissions early for asset tracking
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
        })();
    }, []);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text variant="titleMedium" style={{ textAlign: 'center', color: theme.colors.onSurface, marginBottom: 16 }}>
                    Izin kamera diperlukan untuk memindai Barcode dan QR Code lapangan.
                </Text>
                <Button mode="contained" onPress={requestPermission}>
                    Berikan Izin Kamera
                </Button>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
        setScanned(true);
        Vibration.vibrate(100);

        if (scanMode === 'asset') {
            try {
                const asset = await assetApi.scanByCode(data);
                Alert.alert(
                    "🚜 Aset Terdeteksi",
                    `Nama: ${asset.name}\nKode: ${asset.asset_code}\nStatus: ${asset.status}`,
                    [
                        {
                            text: "Mulai P2H",
                            onPress: () => {
                                router.push({
                                    pathname: '/p2h',
                                    params: { assetId: asset.id, assetName: asset.name },
                                });
                                setTimeout(() => setScanned(false), 1000);
                            },
                        },
                        {
                            text: "Detail Unit",
                            onPress: () => {
                                router.push(`/assets/${asset.id}`);
                                setTimeout(() => setScanned(false), 1000);
                            },
                        },
                        {
                            text: "Scan Lagi",
                            style: "cancel",
                            onPress: () => setScanned(false),
                        },
                    ]
                );
            } catch (error: any) {
                const message = error.response?.status === 404
                    ? `Aset tidak ditemukan untuk kode: ${data}`
                    : "Gagal membaca kode aset. Silakan coba lagi.";
                Alert.alert("Gagal Memindai Aset", message, [
                    { text: "OK", onPress: () => setScanned(false) },
                ]);
            }
        } else {
            // Inventory Mode
            try {
                const item = await inventoryApi.lookupByBarcode(data);
                const stockText = item.current_stock !== undefined ? `${item.current_stock} ${item.uom}` : `Satuan: ${item.uom}`;
                const minStockText = item.min_stock_level !== undefined ? `\nBatas Minimum: ${item.min_stock_level} ${item.uom}` : '';

                Alert.alert(
                    "📦 Suku Cadang Terdeteksi",
                    `Nama: ${item.name}\nKode: ${item.item_code}\nStok: ${stockText}${minStockText}`,
                    [
                        {
                            text: "Scan Lagi",
                            onPress: () => setScanned(false),
                        },
                    ]
                );
            } catch (error: any) {
                Alert.alert(
                    "Barang Tidak Ditemukan",
                    error.message || `Tidak ada suku cadang dengan kode: ${data}`,
                    [{ text: "OK", onPress: () => setScanned(false) }]
                );
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                enableTorch={torch}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: SUPPORTED_BARCODES,
                }}
            >
                <View style={styles.overlay}>
                    {/* Header Controls */}
                    <Surface style={[styles.topBar, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]} elevation={2}>
                        <View style={styles.topRow}>
                            <Text variant="titleMedium" style={{ color: 'white', fontWeight: 'bold' }}>
                                Pemindai Lapangan
                            </Text>
                            <IconButton
                                icon={torch ? "flashlight" : "flashlight-off"}
                                iconColor={torch ? "#f59e0b" : "white"}
                                size={22}
                                onPress={() => setTorch(!torch)}
                            />
                        </View>

                        <SegmentedButtons
                            value={scanMode}
                            onValueChange={(val) => setScanMode(val as 'asset' | 'inventory')}
                            buttons={[
                                { value: 'asset', label: '🚜 Alat Berat & Aset' },
                                { value: 'inventory', label: '📦 Suku Cadang Gudang' },
                            ]}
                            style={styles.segmented}
                            theme={{ colors: { secondaryContainer: theme.colors.primary, onSecondaryContainer: 'white' } }}
                        />
                    </Surface>

                    {/* Viewfinder Target */}
                    <View style={styles.markerContainer}>
                        <View style={[styles.marker, { borderColor: scanMode === 'asset' ? '#38bdf8' : '#10b981' }]} />
                        <Text style={styles.hintText}>
                            {scanMode === 'asset' ? 'Arahkan kamera ke plat QR Aset / Unit' : 'Arahkan kamera ke Barcode Suku Cadang / Rak'}
                        </Text>
                    </View>

                    {/* Bottom Indicator */}
                    <View style={styles.bottomBar}>
                        {scanned && (
                            <Button mode="contained" onPress={() => setScanned(false)} style={styles.rescanBtn}>
                                Ketuk untuk Scan Ulang
                            </Button>
                        )}
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topBar: {
        paddingTop: Platform.OS === 'ios' ? 50 : 36,
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    segmented: {
        marginTop: 4,
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    marker: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    hintText: {
        color: 'white',
        marginTop: 16,
        fontSize: 13,
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bottomBar: {
        padding: 24,
        alignItems: 'center',
    },
    rescanBtn: {
        borderRadius: 24,
        paddingHorizontal: 16,
    },
});
