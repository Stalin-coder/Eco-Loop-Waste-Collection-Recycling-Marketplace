import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { WASTE_TYPES, WASTE_LABELS, WASTE_PRICES } from '@/lib/constants';
import { Camera, Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type WasteType = Database['public']['Enums']['waste_type'];

export default function SchedulePickup() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    waste_type: string;
    estimated_weight_min: number;
    estimated_weight_max: number;
    confidence: number;
    description: string;
  } | null>(null);

  const [form, setForm] = useState({
    waste_type: '' as string,
    estimated_weight: '',
    pickup_address: profile?.address || '',
    preferred_time: '',
  });

  const estimatedPayout = form.waste_type && form.estimated_weight
    ? (WASTE_PRICES[form.waste_type] || 0) * Number(form.estimated_weight)
    : 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('waste-photos')
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    setPhotoPath(path);
    setUploading(false);

    // Get public URL and analyze with AI
    const { data: urlData } = supabase.storage.from('waste-photos').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    setAnalyzing(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('analyze-waste', {
        body: { imageUrl: publicUrl },
      });

      if (fnError) throw fnError;

      if (fnData && !fnData.error) {
        setAiResult(fnData);
        // Auto-fill form with AI suggestions
        setForm(f => ({
          ...f,
          waste_type: fnData.waste_type,
          estimated_weight: String(Math.round(((fnData.estimated_weight_min + fnData.estimated_weight_max) / 2) * 10) / 10),
        }));
        toast({ title: 'AI Analysis Complete ✨', description: fnData.description });
      } else {
        toast({ title: 'AI analysis issue', description: fnData?.error || 'Could not analyze', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('AI analysis error:', err);
      toast({ title: 'AI analysis failed', description: 'You can still select waste type manually.', variant: 'destructive' });
    }
    setAnalyzing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    // Get photo public URL
    let photoUrl: string | null = null;
    if (photoPath) {
      const { data: urlData } = supabase.storage.from('waste-photos').getPublicUrl(photoPath);
      photoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('pickup_requests').insert({
      household_id: profile.id,
      waste_type: form.waste_type as WasteType,
      estimated_weight: Number(form.estimated_weight),
      pickup_address: form.pickup_address,
      city: profile.city,
      area: profile.area,
      preferred_time: form.preferred_time ? new Date(form.preferred_time).toISOString() : null,
      photo_url: photoUrl,
      ai_detected_type: aiResult?.waste_type || null,
      ai_estimated_weight: aiResult ? (aiResult.estimated_weight_min + aiResult.estimated_weight_max) / 2 : null,
      ai_confidence: aiResult?.confidence || null,
    } as any);

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Pickup scheduled!', description: 'A collector will be assigned soon.' });
      navigate('/my-pickups');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Schedule a Pickup</h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Upload Waste Photo (Optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Waste preview" className="w-full h-48 object-cover rounded-lg border" />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                    {analyzing && (
                      <div className="absolute inset-0 bg-background/80 rounded-lg flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Analyzing waste...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-32 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Take photo or upload image</span>
                        <span className="text-xs text-muted-foreground">AI will detect waste type & estimate weight</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* AI Result Badge */}
              {aiResult && (
                <div className="p-3 rounded-lg bg-accent border border-primary/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">AI Detection Result</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {Math.round(aiResult.confidence * 100)}% confident
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{aiResult.description}</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      <span>Type: <strong>{WASTE_LABELS[aiResult.waste_type] || aiResult.waste_type}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      <span>Weight: <strong>{aiResult.estimated_weight_min}–{aiResult.estimated_weight_max} kg</strong></span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    You can adjust the values below if needed
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Waste Type</Label>
                <Select value={form.waste_type} onValueChange={v => setForm(f => ({ ...f, waste_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {WASTE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{WASTE_LABELS[t]} — ₹{WASTE_PRICES[t]}/kg</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estimated Weight (kg)</Label>
                <Input type="number" min="0.1" step="0.1" value={form.estimated_weight}
                  onChange={e => setForm(f => ({ ...f, estimated_weight: e.target.value }))} required placeholder="e.g. 5" />
              </div>
              <div className="space-y-2">
                <Label>Pickup Address</Label>
                <Input value={form.pickup_address}
                  onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))} required placeholder="Full address" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Pickup Time</Label>
                <Input type="datetime-local" value={form.preferred_time}
                  onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))} />
              </div>

              {estimatedPayout > 0 && (
                <div className="p-4 rounded-lg bg-accent border border-primary/20">
                  <p className="text-sm text-muted-foreground">Estimated Payout</p>
                  <p className="text-2xl font-bold text-primary">₹{estimatedPayout.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    + {Math.floor(estimatedPayout / 10)} reward points
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !form.waste_type}>
                {loading ? 'Scheduling...' : 'Schedule Pickup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
