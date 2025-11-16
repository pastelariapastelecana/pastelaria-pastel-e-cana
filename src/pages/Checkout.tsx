"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, QrCode, Loader2, CheckCircle2, User, Mail, CreditCard } from 'lucide-react'; // Re-added CreditCard
import { toast } from 'sonner';
import axios from 'axios';
import PixPaymentDetails from '@/components/PixPaymentDetails';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const { deliveryDetails, deliveryFee } = (location.state || {}) as {
    deliveryDetails?: {
      address: string;
      number: string;
      neighborhood: string;
      city: string;
      zipCode: string;
    };
    deliveryFee?: number | null;
  };

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'mercadopago_checkout_pro'>('pix'); // Added Mercado Pago option
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [pixData, setPixData] = useState<{ qrCodeImage: string; pixCopyPaste: string } | null>(null);
  const [showPixSection, setShowPixSection] = useState(false);

  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');

  const totalWithDelivery = totalPrice + (deliveryFee || 0);

  useEffect(() => {
    if (items.length === 0 || !deliveryDetails || deliveryFee === undefined || deliveryFee === null) {
      toast.info('Por favor, revise seu carrinho e endereço de entrega.');
      navigate('/carrinho');
    }
  }, [items, navigate, deliveryDetails, deliveryFee]);

  const constructFullAddress = (details?: typeof deliveryDetails) => {
    if (!details) return '';
    const { address, number, neighborhood, city, zipCode } = details;
    return `${address}, ${number}, ${neighborhood}, ${city} - ${zipCode}`;
  };

  const handlePixPayment = async () => {
    if (!deliveryDetails || deliveryFee === null) {
      toast.error('Detalhes de entrega ou taxa de frete ausentes. Por favor, retorne ao carrinho.');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');
    setShowPixSection(false);
    setPixData(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate-pix`, {
        amount: totalWithDelivery,
        description: `Pedido Pastel & Cana - ${new Date().toLocaleDateString('pt-BR')}`,
        payerEmail: payerEmail,
        payerName: payerName,
      });
      setPixData(response.data);
      setShowPixSection(true);
      setPaymentStatus('idle');
      toast.info('QR Code PIX gerado. Por favor, realize o pagamento.');
    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      toast.error('Ocorreu um erro ao gerar o PIX. Tente novamente.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePixConfirmation = async () => {
    setIsLoading(true);
    setPaymentStatus('processing');
    try {
      await axios.post(`${BACKEND_URL}/api/confirm-order`, {
        items: items,
        deliveryDetails: deliveryDetails,
        deliveryFee: deliveryFee,
        totalPrice: totalWithDelivery,
        paymentMethod: 'pix',
        payerName: payerName,
        payerEmail: payerEmail,
      });

      toast.success('Pagamento PIX confirmado! Seu pedido foi realizado.');
      setPaymentStatus('success');
      clearCart();
      navigate('/pagamento/sucesso');
    } catch (error) {
      console.error('Erro ao confirmar pedido no backend:', error);
      toast.error('Ocorreu um erro ao confirmar seu pedido. Por favor, entre em contato.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMercadoPagoCheckout = async () => {
    if (!deliveryDetails || deliveryFee === null) {
      toast.error('Detalhes de entrega ou taxa de frete ausentes. Por favor, retorne ao carrinho.');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      const orderItems = items.map(item => ({
        id: item.id,
        title: item.name,
        description: item.name, // Usar o nome como descrição para simplicidade
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: item.price,
      }));

      const response = await axios.post(`${BACKEND_URL}/api/create-payment`, {
        items: orderItems,
        payer: {
          name: payerName,
          email: payerEmail,
        },
      });

      if (response.data && response.data.init_point) {
        // Redirecionar para o Checkout Pro do Mercado Pago
        window.location.href = response.data.init_point;
        // O restante da lógica de confirmação será tratada pelo retorno do Mercado Pago
        // para a URL de sucesso configurada no backend.
      } else {
        throw new Error('Link de pagamento do Mercado Pago não recebido.');
      }
    } catch (error) {
      console.error('Erro ao iniciar Checkout Pro do Mercado Pago:', error);
      toast.error('Ocorreu um erro ao iniciar o pagamento com Mercado Pago. Tente novamente.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Se o pagamento foi um sucesso (após PIX ou retorno do MP)
  if (paymentStatus === 'success' || location.pathname === '/pagamento/sucesso') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <CheckCircle2 className="w-24 h-24 mx-auto text-accent mb-6" />
            <h2 className="text-3xl font-bold mb-4">Pedido Realizado com Sucesso!</h2>
            <p className="text-muted-foreground mb-8">
              Agradecemos a sua compra. Seu pedido está sendo preparado!
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                Voltar para o Início
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!deliveryDetails || deliveryFee === undefined || deliveryFee === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <Loader2 className="w-24 h-24 mx-auto text-primary animate-spin mb-6" />
            <h2 className="text-3xl font-bold mb-4">Carregando detalhes do pedido...</h2>
            <p className="text-muted-foreground mb-8">
              Se o carregamento demorar, por favor, retorne ao carrinho.
            </p>
            <Button onClick={() => navigate('/carrinho')} variant="hero" size="lg">
              Voltar para o Carrinho
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPayerDetailsMissing = !payerName.trim() || !payerEmail.trim();
  const isCheckoutButtonDisabled = items.length === 0 || isPayerDetailsMissing || isLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Finalizar Pedido</h1>
            <p className="text-xl opacity-90">Confirme seus dados e escolha a forma de pagamento</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Resumo do Pedido */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Seu Pedido</h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} x R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="font-bold">R$ {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-4 space-y-2">
                {deliveryFee !== null && (
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="font-medium text-accent">R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Endereço de Entrega (apenas exibição) */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Endereço de Entrega
              </h2>
              <p className="text-lg text-muted-foreground">
                {constructFullAddress(deliveryDetails)}
              </p>
              <Button variant="link" className="pl-0 mt-2" onClick={() => navigate('/carrinho')}>
                Alterar Endereço
              </Button>
            </div>

            {/* Dados do Pagador */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Dados do Pagador
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payerName">Nome Completo *</Label>
                  <Input
                    id="payerName"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payerEmail">E-mail *</Label>
                  <Input
                    id="payerEmail"
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Forma de Pagamento</h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value: 'pix' | 'mercadopago_checkout_pro') => { // Updated options
                  setPaymentMethod(value);
                  setShowPixSection(false);
                  setPixData(null);
                  setIsLoading(false);
                }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="pix" id="payment-pix" />
                  <Label htmlFor="payment-pix" className="flex items-center gap-2 text-lg font-medium cursor-pointer">
                    <QrCode className="w-6 h-6 text-green-600" />
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="mercadopago_checkout_pro" id="payment-mercadopago" />
                  <Label htmlFor="payment-mercadopago" className="flex items-center gap-2 text-lg font-medium cursor-pointer">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Cartão de Crédito/Débito (Mercado Pago)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Seção de Detalhes do PIX */}
            {paymentMethod === 'pix' && showPixSection && pixData && (
              <PixPaymentDetails
                qrCodeImage={pixData.qrCodeImage}
                pixCopyPaste={pixData.pixCopyPaste}
                onConfirmPayment={handlePixConfirmation}
                isLoading={isLoading}
              />
            )}

            {/* Total e Botão Finalizar (para PIX antes de gerar QR ou para Mercado Pago Checkout Pro) */}
            {(paymentMethod === 'pix' && !showPixSection) || paymentMethod === 'mercadopago_checkout_pro' ? (
              <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  {deliveryFee !== null && (
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">Frete:</span>
                      <span className="font-medium text-accent">R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 flex justify-between text-2xl font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-primary">R$ {totalWithDelivery.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={paymentMethod === 'pix' ? handlePixPayment : handleMercadoPagoCheckout}
                  disabled={isCheckoutButtonDisabled}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    paymentMethod === 'pix' ? 'Gerar PIX e Finalizar Compra' : 'Pagar com Mercado Pago'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
