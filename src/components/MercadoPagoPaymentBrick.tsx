"use client";

import React, { useEffect, useRef, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { PaymentBrick } from '@mercadopago/sdk-js';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface MercadoPagoPaymentBrickProps {
  totalAmount: number;
  payerEmail: string;
  payerName: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const BACKEND_URL = 'https://pastelaria-backend-yva1.onrender.com';

const MercadoPagoPaymentBrick: React.FC<MercadoPagoPaymentBrickProps> = ({
  totalAmount,
  payerEmail,
  payerName,
  onPaymentSuccess,
  onPaymentError,
  isLoading,
  setIsLoading,
}) => {
  const brickContainer = useRef<HTMLDivElement>(null);
  const [brickLoaded, setBrickLoaded] = useState(false);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    console.log('MercadoPagoPaymentBrick: Public Key carregada:', publicKey ? 'Sim' : 'Não', publicKey);

    if (!publicKey) {
      toast.error('Chave pública do Mercado Pago não configurada. Verifique VITE_MERCADOPAGO_PUBLIC_KEY no .env');
      setIsLoading(false);
      return;
    }

    if (!brickContainer.current) {
      console.log('MercadoPagoPaymentBrick: Container do Brick não disponível.');
      return;
    }

    const initializeMercadoPago = async () => {
      setIsLoading(true);
      setBrickLoaded(false); // Resetar o estado de carregamento do brick
      console.log('MercadoPagoPaymentBrick: Iniciando carregamento do SDK...');
      try {
        await loadMercadoPago(publicKey, {
          locale: 'pt-BR',
        });
        console.log('MercadoPagoPaymentBrick: SDK do Mercado Pago carregado com sucesso.');

        const settings = {
          initialization: {
            amount: totalAmount,
            payer: {
              email: payerEmail,
              firstName: payerName.split(' ')[0] || '',
              lastName: payerName.split(' ').slice(1).join(' ') || '',
            },
          },
          customization: {
            visual: {
              hideFormTitle: true,
              style: {
                theme: 'dark',
              },
            },
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              maxInstallments: 1,
            },
          },
          callbacks: {
            onReady: () => {
              console.log('MercadoPagoPaymentBrick: Brick está PRONTO!');
              setBrickLoaded(true);
              setIsLoading(false);
            },
            onSubmit: async (formData: any) => {
              setIsLoading(true);
              console.log('MercadoPagoPaymentBrick: Dados do formulário para submissão:', formData);
              try {
                const response = await axios.post(`${BACKEND_URL}/api/process-transparent-card-payment`, {
                  ...formData,
                  transaction_amount: totalAmount,
                  description: `Pedido Pastel & Cana - ${new Date().toLocaleDateString('pt-BR')}`,
                  payer: {
                    email: payerEmail,
                    first_name: payerName.split(' ')[0] || '',
                    last_name: payerName.split(' ').slice(1).join(' ') || '',
                    // Adicionar identificação se necessário para o país
                    identification: {
                      type: 'CPF', // Exemplo, ajuste conforme a necessidade do seu país
                      number: '12345678909', // Exemplo, use um valor real ou colete do usuário
                    },
                  },
                });

                console.log('MercadoPagoPaymentBrick: Resposta do backend:', response.data);

                if (response.data.id && response.data.status === 'approved') {
                  onPaymentSuccess(response.data.id);
                } else {
                  onPaymentError(response.data);
                }
              } catch (error: any) {
                console.error('MercadoPagoPaymentBrick: Erro ao processar pagamento transparente:', error.response ? error.response.data : error.message);
                toast.error('Erro ao processar pagamento. Verifique o console para detalhes.');
                onPaymentError(error.response ? error.response.data : error.message);
              } finally {
                setIsLoading(false);
              }
            },
            onError: (error: any) => {
              console.error('MercadoPagoPaymentBrick: Erro reportado pelo PaymentBrick:', error);
              toast.error('Erro no formulário de pagamento. Tente novamente.');
              setIsLoading(false);
            },
          },
        };

        if (brickContainer.current) {
          console.log('MercadoPagoPaymentBrick: Tentando renderizar o PaymentBrick...');
          const bricks = new PaymentBrick(settings);
          bricks.render(brickContainer.current);
        }
      } catch (error) {
        console.error('MercadoPagoPaymentBrick: Erro FATAL ao inicializar Mercado Pago SDK:', error);
        toast.error('Erro fatal ao carregar o SDK do Mercado Pago. Verifique sua chave pública e conexão.');
        setIsLoading(false);
      }
    };

    initializeMercadoPago();

    return () => {
      if (brickContainer.current) {
        brickContainer.current.innerHTML = '';
      }
    };
  }, [totalAmount, payerEmail, payerName, onPaymentSuccess, onPaymentError, setIsLoading]);

  return (
    <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Dados do Cartão</h2>
      {!brickLoaded && (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando formulário de pagamento...</span>
        </div>
      )}
      <div ref={brickContainer} className={brickLoaded ? '' : 'hidden'} />
      {isLoading && brickLoaded && (
        <div className="flex justify-center items-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Processando pagamento...</span>
        </div>
      )}
    </div>
  );
};

export default MercadoPagoPaymentBrick;
