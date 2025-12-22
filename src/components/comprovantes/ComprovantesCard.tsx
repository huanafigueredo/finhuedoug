import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  QrCode, 
  Upload, 
  FileImage, 
  FileText, 
  Eye, 
  Trash2, 
  Loader2,
  X
} from 'lucide-react';
import { useComprovantes, useComprovantesMutations, Comprovante } from '@/hooks/useComprovantes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface ComprovantesCardProps {
  lancamentoId: string;
  onQrScanned?: (qrData: string) => void;
}

export function ComprovantesCard({ lancamentoId, onQrScanned }: ComprovantesCardProps) {
  const { data: comprovantes, isLoading } = useComprovantes(lancamentoId);
  const { uploadComprovante, deleteComprovante } = useComprovantesMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; comprovante?: Comprovante }>({ open: false });
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; comprovante?: Comprovante }>({ open: false });
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; file?: File }>({ open: false });
  const [showQrScanner, setShowQrScanner] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo inválido',
        description: 'Envie apenas imagens (JPG, PNG) ou PDFs.',
        variant: 'destructive',
      });
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadComprovante.mutateAsync({ lancamentoId, file });
    } catch (error: any) {
      if (error.message === 'DUPLICATE_FILE') {
        setDuplicateDialog({ open: true, file });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleForceUpload = async () => {
    const file = duplicateDialog.file;
    if (!file) return;
    
    // For now, just close the dialog - user chose to cancel
    setDuplicateDialog({ open: false });
  };

  const handleScanQr = () => {
    setShowQrScanner(true);
  };

  const handleQrResult = async (qrData: string) => {
    setShowQrScanner(false);
    
    // Create a text file with the QR data
    const blob = new Blob([qrData], { type: 'text/plain' });
    const file = new File([blob], `nfce_qr_${Date.now()}.txt`, { type: 'text/plain' });

    setIsUploading(true);
    try {
      await uploadComprovante.mutateAsync({ 
        lancamentoId, 
        file,
        nfeQrUrl: qrData 
      });
      onQrScanned?.(qrData);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.comprovante) return;
    
    await deleteComprovante.mutateAsync({ 
      id: deleteDialog.comprovante.id, 
      lancamentoId 
    });
    setDeleteDialog({ open: false });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-destructive" />;
    }
    return <FileImage className="w-4 h-4 text-primary" />;
  };

  return (
    <>
      <Card className="p-4 bg-secondary/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">Comprovantes</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanQr}
              disabled={isUploading}
              className="gap-1.5 text-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR NFC-e
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-1.5 text-xs"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Foto/PDF
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comprovantes && comprovantes.length > 0 ? (
          <div className="space-y-2">
            {comprovantes.map((comprovante) => (
              <div 
                key={comprovante.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(comprovante.file_type)}
                  <span className="text-xs text-foreground truncate max-w-[150px]">
                    {comprovante.file_name}
                  </span>
                  {comprovante.nfe_qr_url && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      NFC-e
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewDialog({ open: true, comprovante })}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialog({ open: true, comprovante })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic text-center py-2">
            Nenhum comprovante anexado
          </p>
        )}
      </Card>

      {/* QR Scanner Modal */}
      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear QR Code NFC-e</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole ou digite a URL do QR Code da NFC-e:
            </p>
            <Input
              placeholder="https://www.sefaz..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value;
                  if (value) handleQrResult(value);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowQrScanner(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="https://www.sefaz..."]') as HTMLInputElement;
                  if (input?.value) handleQrResult(input.value);
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open })}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewDialog.comprovante?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {previewDialog.comprovante?.file_type === 'application/pdf' ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Visualização de PDF não disponível
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(previewDialog.comprovante?.file_url, '_blank')}
                >
                  Abrir PDF
                </Button>
              </div>
            ) : (
              <img
                src={previewDialog.comprovante?.file_url}
                alt={previewDialog.comprovante?.file_name}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover comprovante?</AlertDialogTitle>
            <AlertDialogDescription>
              O comprovante "{deleteDialog.comprovante?.file_name}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Warning */}
      <AlertDialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Comprovante duplicado</AlertDialogTitle>
            <AlertDialogDescription>
              Parece que este comprovante já foi anexado. Deseja manter mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceUpload}>
              Manter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
