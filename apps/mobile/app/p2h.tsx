import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, Button, Checkbox, List, useTheme, TextInput, SegmentedButtons, Card, Chip, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { workOrderApi } from '../api/workOrder';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const CHECKLIST_ITEMS = [
    { key: "oil_engine", label: "Level & Kualitas Oli Mesin (Engine Oil)" },
    { key: "coolant", label: "Air Radiator & Coolant Level" },
    { key: "hydraulic", label: "Level Oli Hidrolik & Kebocoran Slang" },
    { key: "brake", label: "Kondisi Rem Kerja & Rem Parkir" },
    { key: "tire_track", label: "Kondisi Ban / Track Shoe & Underpass" },
    { key: "lights", label: "Lampu Kerja, Rotary, & Sein Lamp" },
    { key: "horn_alarm", label: "Klakson & Back Alarm Mundur" },
    { key: "seatbelt", label: "Seat Belt & Safety Lock Cabin" },
    { key: "apar", label: "APAR (Alat Pemadam Api Ringan)" },
    { key: "cleanliness", label: "Kebersihan Umum & Bebas Ceceran Oli" },
];

export default function P2HScreen() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ assetId?: string; assetName?: string }>();
    const assetId = params.assetId || '';
    const assetName = params.assetName || 'Unit Alat Berat';

    const [hourMeter, setHourMeter] = useState('');
    const [conditionStatus, setConditionStatus] = useState<'FIT' | 'WARNING' | 'BREAKDOWN'>('FIT');
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
        oil_engine: true,
        coolant: true,
        hydraulic: true,
        brake: true,
        tire_track: true,
        lights: true,
        horn_alarm: true,
        seatbelt: true,
        apar: true,
        cleanliness: true,
    });
    const [notes, setNotes] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Kamera', 'Izin kamera diperlukan untuk mengambil foto bukti fisik unit.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const mutation = useMutation({
        mutationFn: workOrderApi.create,
        onSuccess: async (wo) => {
            // Add checklist records
            for (const item of CHECKLIST_ITEMS) {
                await workOrderApi.addChecklistItem(wo.id, {
                    description: item.label,
                    instructions: checkedItems[item.key] ? "LULUS (Passed)" : "TEMUAN (Failed)",
                });
            }
            Alert.alert(
                'Inspeksi Berhasil Dikirim',
                `Laporan P2H untuk ${assetName} berhasil tercatat di sistem dengan status: ${conditionStatus}.`,
                [{ text: 'Selesai', onPress: () => router.back() }]
            );
        },
        onError: (e: any) => {
            Alert.alert('Gagal Mengirim', e.message || 'Gagal menyimpan data P2H. Silakan coba lagi.');
            setSubmitting(false);
        },
    });

    const handleSubmit = () => {
        if (!hourMeter.trim()) {
            Alert.alert('Validasi', 'Harap isi Hour Meter (HM) / Odometer unit saat ini!');
            return;
        }

        setSubmitting(true);
        const descriptionPayload = `[P2H INSPEKSI HARIAN]\nUnit: ${assetName}\nHour Meter: ${hourMeter} HM\nStatus Kelaikan: ${conditionStatus}\nCatatan: ${notes || 'Kondisi normal'}`;

        mutation.mutate({
            asset_id: assetId,
            wo_type: 'p2h_inspection',
            problem_description: descriptionPayload,
            priority: conditionStatus === 'BREAKDOWN' ? 'critical' : conditionStatus === 'WARNING' ? 'high' : 'medium',
        });
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Surface style={styles.headerCard} elevation={2}>
                    <Text variant="headlineSmall" style={styles.headerTitle}>Inspeksi Harian (P2H)</Text>
                    <Text variant="titleMedium" style={styles.headerSubtitle}>🚜 {assetName}</Text>
                </Surface>

                {/* Hour Meter & Status */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>1. Data Operasional & Jam Kerja</Text>
                        <TextInput
                            label="Hour Meter (HM) / Odometer (KM)*"
                            value={hourMeter}
                            onChangeText={setHourMeter}
                            keyboardType="numeric"
                            placeholder="Contoh: 14250.5"
                            mode="outlined"
                            style={styles.textInput}
                        />

                        <Text variant="bodyMedium" style={[styles.subLabel, { marginTop: 12 }]}>Status Kelaikan Operasi:</Text>
                        <SegmentedButtons
                            value={conditionStatus}
                            onValueChange={(val) => setConditionStatus(val as any)}
                            buttons={[
                                { value: 'FIT', label: '🟢 Siap Kerja' },
                                { value: 'WARNING', label: '🟡 Servis Ringan' },
                                { value: 'BREAKDOWN', label: '🔴 Breakdown' },
                            ]}
                            style={styles.segmented}
                        />
                    </Card.Content>
                </Card>

                {/* 10-Point Checklist */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>2. Checklist Pemeriksaan Fisik</Text>
                        <Text variant="bodySmall" style={styles.hintText}>Beri tanda centang pada item yang dalam kondisi aman dan normal.</Text>

                        {CHECKLIST_ITEMS.map((item) => (
                            <List.Item
                                key={item.key}
                                title={item.label}
                                titleNumberOfLines={2}
                                titleStyle={{ color: 'white', fontSize: 13 }}
                                style={styles.checklistItem}
                                right={() => (
                                    <Checkbox.Android
                                        status={checkedItems[item.key] ? 'checked' : 'unchecked'}
                                        onPress={() => setCheckedItems((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        color={theme.colors.primary}
                                    />
                                )}
                            />
                        ))}
                    </Card.Content>
                </Card>

                {/* Photo & Notes */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>3. Foto Bukti Fisik & Catatan Tambahan</Text>

                        <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>📷 Ambil Foto Kondisi Unit</Text>
                                    <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Ketuk untuk menyalakan kamera smartphone</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TextInput
                            label="Catatan Temuan / Kerusakan (Optional)"
                            value={notes}
                            onChangeText={setNotes}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            placeholder="Tuliskan jika ada rembesan, baret, atau suara abnormal..."
                            style={[styles.textInput, { marginTop: 12 }]}
                        />
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={submitting || mutation.isPending}
                    disabled={submitting || mutation.isPending}
                    style={styles.submitBtn}
                    contentStyle={{ paddingVertical: 8 }}
                >
                    Kirim Hasil Inspeksi P2H
                </Button>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
    headerCard: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    headerTitle: { color: 'white', fontWeight: 'bold' },
    headerSubtitle: { color: '#38bdf8', marginTop: 4 },
    sectionCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: { color: 'white', fontWeight: 'bold', marginBottom: 8 },
    subLabel: { color: '#e2e8f0', marginBottom: 6 },
    hintText: { color: '#94a3b8', marginBottom: 12 },
    textInput: { backgroundColor: '#0f172a' },
    segmented: { marginTop: 4 },
    checklistItem: {
        paddingVertical: 4,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    photoContainer: {
        marginTop: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    photoPlaceholder: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    photoPreview: {
        width: '100%',
        height: 180,
        borderRadius: 10,
    },
    submitBtn: {
        marginTop: 8,
        borderRadius: 8,
    },
});
