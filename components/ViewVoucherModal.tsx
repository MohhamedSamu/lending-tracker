'use client'

import React from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { ExternalLink, Download } from 'lucide-react'

interface ViewVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  voucherUrl: string
}

const ViewVoucherModal: React.FC<ViewVoucherModalProps> = ({
  isOpen,
  onClose,
  voucherUrl
}) => {
  const isImage = voucherUrl.match(/\.(jpeg|jpg|gif|png)$/i)
  const isPDF = voucherUrl.match(/\.pdf$/i)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = voucherUrl
    link.download = `voucher_${Date.now()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(voucherUrl, '_blank')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voucher de Transferencia"
      size="lg"
    >
      <div className="space-y-4">
        {/* Preview Area */}
        <div className="bg-gray-50 rounded-lg p-4 min-h-96 flex items-center justify-center">
          {isImage ? (
            <img
              src={voucherUrl}
              alt="Voucher de transferencia"
              className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
            />
          ) : isPDF ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Documento PDF</p>
                <p className="text-sm text-gray-500">
                  Haz clic en "Abrir en nueva pestaña" para ver el documento
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📎</span>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Archivo adjunto</p>
                <p className="text-sm text-gray-500">
                  Tipo de archivo no soportado para vista previa
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center space-x-2"
            >
              <ExternalLink size={16} />
              <span>Abrir en nueva pestaña</span>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Descargar</span>
            </Button>
          </div>

          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ViewVoucherModal
