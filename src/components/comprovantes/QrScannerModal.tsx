import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, Loader2, SwitchCamera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QrScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (qrData: string) => void;
}

export function QrScannerModal({ open, onOpenChange, onScanSuccess }: QrScannerModalProps) {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    try {
      setIsStarting(true);

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        
        // Prefer back camera
        const backCameraIndex = devices.findIndex(
          d => d.label.toLowerCase().includes('back') || 
               d.label.toLowerCase().includes('traseira') ||
               d.label.toLowerCase().includes('rear')
        );
        const cameraIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
        setCurrentCameraIndex(cameraIndex);

        await initializeScanner(devices[cameraIndex].id);
      } else {
        toast({
          title: 'Câmera não encontrada',
          description: 'Nenhuma câmera disponível no dispositivo.',
          variant: 'destructive',
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      toast({
        title: 'Erro ao acessar câmera',
        description: error.message || 'Verifique as permissões da câmera.',
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setIsStarting(false);
    }
  };

  const initializeScanner = async (cameraId: string) => {
    try {
      // Stop existing scanner if any
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      }

      // Create new scanner instance
      scannerRef.current = new Html5Qrcode('qr-reader');

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore errors during scanning (e.g., no QR found in frame)
        }
      );

      setIsScanning(true);
    } catch (error: any) {
      console.error('Error initializing scanner:', error);
      toast({
        title: 'Erro ao iniciar scanner',
        description: 'Não foi possível iniciar a câmera.',
        variant: 'destructive',
      });
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      }
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Check if it's a valid NFC-e URL
    const isNfceUrl = 
      decodedText.includes('sefaz') ||
      decodedText.includes('nfce') ||
      decodedText.includes('fazenda') ||
      decodedText.startsWith('http');

    if (isNfceUrl) {
      stopScanner();
      onScanSuccess(decodedText);
      onOpenChange(false);
      toast({
        title: 'QR Code lido!',
        description: 'Nota fiscal identificada com sucesso.',
      });
    } else {
      toast({
        title: 'QR Code inválido',
        description: 'Este não parece ser um QR Code de NFC-e.',
        variant: 'destructive',
      });
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await initializeScanner(cameras[nextIndex].id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Escanear QR Code NFC-e
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Scanner container */}
          <div 
            id="qr-reader" 
            className="w-full bg-black"
            style={{ minHeight: '300px' }}
          />

          {/* Loading overlay */}
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Iniciando câmera...</span>
              </div>
            </div>
          )}

          {/* Scanning indicator */}
          {isScanning && !isStarting && (
            <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
              <span className="text-xs bg-primary/90 text-primary-foreground px-2 py-1 rounded">
                Aponte para o QR Code
              </span>
              {cameras.length > 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={switchCamera}
                >
                  <SwitchCamera className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 pt-2">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Posicione o QR Code da nota fiscal dentro do quadrado
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
