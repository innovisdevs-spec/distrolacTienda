import { WhatsAppOrder } from "../StoreOptions/StoreOptions";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Form, Button, Alert, Modal, InputGroup } from "react-bootstrap";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useLoginMutation, useRegisterMutation, useForgotPasswordMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import "./Login.css";
import { HTML_PASSWORD_PATTERN, PASSWORD_HELP, passwordRules, getRegistrationErrors, getRegisterErrorMessage } from "./registrationValidation";
import BackIcon from "@mui/icons-material/ArrowBack";
import Logo from "../../assets/logo-catalogo.png";

/* =====================================================
   VALIDACIONES
===================================================== */
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface RegisterFormData {
  username: string; // queda en el state pero ya no se pide en el formulario
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  phone: string;
  alias: string;
}

type RegisterErrorType = "client" | "server" | null;

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");
  const reason = params.get("reason");

  const [checkoutMessage, setCheckoutMessage] = useState("");

  // ================= LOGIN =================
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState("");

  // ================= REGISTER =================
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    username: "", // ya no se completa en UI, backend lo genera
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
    alias: "",
  });

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerValidated, setRegisterValidated] = useState(false);
  const [registerTouched, setRegisterTouched] = useState<Record<string, boolean>>({});
  const registerFieldErrors = getRegistrationErrors({ ...registerData });
  const fieldInvalid = (name: string) => Boolean((registerValidated || registerTouched[name]) && registerFieldErrors[name]);
  const [registerError, setRegisterError] = useState("");
  const [registerErrorType, setRegisterErrorType] =
    useState<RegisterErrorType>(null);
  const [dniServerError, setDniServerError] = useState(false);
  const [emailServerError, setEmailServerError] = useState(false);

  // ================= MAPA =================
  const [showMapModal, setShowMapModal] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [modalAutocomplete, setModalAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'distrolac-google-maps',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [forgotPassword, { isLoading: isForgotLoading }] = useForgotPasswordMutation();

  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [showRegister]);

  // ================= FORGOT PASSWORD =================
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotEmailValid, setForgotEmailValid] = useState(true);

  /* MENSAJE SI VIENE DEL CHECKOUT */
  useEffect(() => {
    if (reason === "checkout") {
      setCheckoutMessage(
        "Para continuar con la compra debes iniciar sesión o crear una cuenta.",
      );
    }
  }, [reason]);

  // ================= MAP EFFECT =================
  useEffect(() => {
    if (!isLoaded || !showMapModal || !mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: -32.8894, lng: -68.8458 },
      mapTypeControl: false,
      streetViewControl: false,
    });

    const markerInstance = new google.maps.Marker({
      map: mapInstance,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    if (registerData.address) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: registerData.address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          mapInstance.setCenter(results[0].geometry.location);
          markerInstance.setPosition(results[0].geometry.location);
        }
      });
    }

    markerInstance.addListener("dragend", () => {
      const position = markerInstance.getPosition();
      if (!position) return;

      new google.maps.Geocoder().geocode(
        { location: position },
        (results, status) => {
          if (status === "OK" && results?.[0]) {
            setRegisterData((prev) => ({
              ...prev,
              address: results[0].formatted_address,
            }));
          }
        },
      );
    });

    return () => {
      markerInstance.setMap(null);
      setMap(null);
      setMarker(null);
    };
  }, [isLoaded, showMapModal]);

  // ================= LOGIN HANDLER =================
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    try {
      const res = await login({
        email: usernameOrEmail.trim(),
        password,
      }).unwrap();

      dispatch(setCredentials({ ...res }));

      if (redirect) {
        navigate(`/${redirect}`, { replace: true });
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err?.data?.message || "Error al iniciar sesión.");
    }
  };

  // ================= REGISTER HANDLER =================
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterErrorType(null);
    setRegisterValidated(true);
    // Limpiar errores del servidor al intentar registrar nuevamente
    setDniServerError(false);
    setEmailServerError(false);

    const form = e.currentTarget;
    const errors = getRegistrationErrors({ ...registerData });
    const firstInvalid = ["firstName", "lastName", "phone", "address", "email", "dni", "password", "confirmPassword"].find((name) => errors[name]);
    if (firstInvalid) {
      setRegisterError(errors[firstInvalid]);
      setRegisterErrorType("client");
      const field = form.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`);
      field?.focus();
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    try {
      // No enviamos username: el backend lo genera automáticamente
      const { username: _username, ...payload } = {
        ...registerData,
        firstName: registerData.firstName.trim(),
        lastName: registerData.lastName.trim(),
        dni: registerData.dni.trim(),
        email: registerData.email.trim().toLowerCase(),
        address: registerData.address.trim(),
        phone: registerData.phone.trim(),
        alias: registerData.alias.trim(),
      };

      const res = await register(payload as any).unwrap();
      dispatch(setCredentials({ ...res }));

      if (redirect) {
        navigate(`/${redirect}`, { replace: true });
      } else {
        navigate("/");
      }
    } catch (err: any) {
      // Mostrar mensaje de error específico del backend
      const errorMessage = getRegisterErrorMessage(err);
      setRegisterError(errorMessage);
      setRegisterErrorType("server");

      // Si el error es sobre DNI, marcar el campo como inválido
      if (errorMessage.toLowerCase().includes("dni")) {
        setDniServerError(true);
      }

      // Si el error es sobre usuario ya registrado, marcar email como inválido
      if (
        errorMessage.toLowerCase().includes("usuario ya registrado") ||
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("correo")
      ) {
        setEmailServerError(true);
      }
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const normalizedValue = name === "phone" ? value.replace(/\D/g, "") : value;

    setRegisterData((prev) => ({
      ...prev,
      [name]: normalizedValue,
      ...(name === "dni" ? { alias: `${normalizedValue}.distrolac` } : {}),
    }));
    // Limpiar errores del servidor cuando el usuario modifica los campos
    if (name === "dni") {
      setDniServerError(false);
    }
    if (name === "email") {
      setEmailServerError(false);
    }
  };

  // ================= FORGOT PASSWORD HANDLER =================
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleForgotEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForgotEmail(value);
    setForgotEmailValid(emailRegex.test(value) || value === "");
    setForgotError("");
    setForgotSuccess("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail) {
      setForgotError("El email es requerido");
      return;
    }

    if (!emailRegex.test(forgotEmail)) {
      setForgotError("Ingrese un email válido");
      return;
    }

    try {
      await forgotPassword(forgotEmail).unwrap();
      setForgotSuccess("Se ha enviado un correo con instrucciones para restablecer tu contraseña");
      setForgotEmail("");
    } catch (err: any) {
      setForgotError(err?.data?.message || "Error al enviar el correo");
    }
  };

  return (
    <div className="login-page">
      {checkoutMessage && (
        <div className="checkout-alert-container">
          <Alert variant="info">{checkoutMessage}</Alert>
        </div>
      )}

      <div className={showRegister ? "left-container" : "hidden-register"}>
        <div>
          <div className="logo-container">
            <img
              src={Logo}
              alt="Distrolac Logo"
              className="distro-logo-login"
            />
          </div>

          <div className="div-register-container">
            <h1 className="title-auth">Creá tu cuenta</h1><p className="auth-intro">Guardá tus datos para hacer este pedido y los próximos más fácil.</p>
            <hr className="red-line-login" />
            {registerError && (
              <Alert
                variant={registerErrorType === "server" ? "danger" : "warning"}
              >
                {registerError}
              </Alert>
            )}

            {registerErrorType === "server" && <div className="auth-recovery">
              <button type="button" onClick={() => { setUsernameOrEmail(registerData.email); setShowRegister(false); setShowLogin(true); }}>Ya tengo cuenta</button>
              <button type="button" onClick={() => { setForgotEmail(registerData.email); setForgotError(""); setForgotSuccess(""); setForgotEmailValid(true); setShowForgotModal(true); }}>Recuperar contraseña</button>
            </div>}
            <Form
              noValidate
              validated={registerValidated}
              onSubmit={handleRegister}
              className="register-form "
              onBlurCapture={(e) => { const target = e.target; const name = target instanceof HTMLInputElement ? target.name : ""; if (name) setRegisterTouched((prev) => ({ ...prev, [name]: true })); }}
            >
<div className="delivery-auth">
                <h1 className="title-auth">Datos del envío</h1>

                <div className="name-lastname-auth">
                  <div>
                    <Form.Group controlId="registerFirstName">
                      <Form.Label className="auth-label">Nombre</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName" autoComplete="given-name" isInvalid={fieldInvalid("firstName")}
                        placeholder="Nombre"
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                        required
                        disabled={isRegisterLoading}
                        className="input-form"
                      />
                    <div className="invalid-feedback" style={{display: fieldInvalid("firstName") ? "block" : "none"}}>{registerFieldErrors.firstName}</div></Form.Group>
                  </div>

                  <div>
                    <Form.Group controlId="registerLastName">
                      <Form.Label className="auth-label">Apellido</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName" autoComplete="family-name" isInvalid={fieldInvalid("lastName")}
                        placeholder="Apellido"
                        value={registerData.lastName}
                        onChange={handleRegisterChange}
                        required
                        disabled={isRegisterLoading}
                        className="input-form"
                      />
                    <div className="invalid-feedback" style={{display: fieldInvalid("lastName") ? "block" : "none"}}>{registerFieldErrors.lastName}</div></Form.Group>
                  </div>
                </div>

                <div>
                  <Form.Group controlId="registerPhone">
                    <Form.Label className="auth-label">Teléfono</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone" autoComplete="tel" isInvalid={fieldInvalid("phone")}
                      placeholder="Ingrese su teléfono"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      required
                      inputMode="numeric"
                      disabled={isRegisterLoading}
                      className="input-form"
                    />
                  <div className="invalid-feedback" style={{display: fieldInvalid("phone") ? "block" : "none"}}>{registerFieldErrors.phone}</div></Form.Group>
                </div>

                <div>
                  <Form.Group controlId="registerAddress">
                    <Form.Label className="auth-label">Dirección</Form.Label>

                    <InputGroup className="adress-group">
                      {loadError && <p role="status">No pudimos cargar el mapa. Podés escribir tu dirección completa y continuar.</p>}
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(instance) => setAutocomplete(instance)}
                          onPlaceChanged={() => {
                            if (autocomplete) {
                              const place = autocomplete.getPlace();
                              if (place && place.formatted_address) {
                                setRegisterData((prev) => ({
                                  ...prev,
                                  address: place.formatted_address ?? "",
                                }));

                                if (
                                  map &&
                                  marker &&
                                  place.geometry &&
                                  place.geometry.location
                                ) {
                                  map.panTo(place.geometry.location);
                                  map.setZoom(17);
                                  marker.setPosition(place.geometry.location);
                                }
                              }
                            }
                          }}
                        >
                          <Form.Control
                            type="text"
                            name="address" autoComplete="street-address" isInvalid={fieldInvalid("address")}
                            placeholder="Ingresa o busca tu dirección"
                            value={registerData.address}
                            onChange={handleRegisterChange}
                            required
                            disabled={isRegisterLoading}
                            className="input-form adress-input"
                          />
                        </Autocomplete>
                      ) : (
                        <Form.Control
                          type="text"
                          name="address" value={registerData.address} onChange={handleRegisterChange}
                        placeholder="Calle, número y localidad" autoComplete="street-address"
                        required disabled={isRegisterLoading} isInvalid={fieldInvalid("address")}
                          className="input-form adress-input"
                        />
                      )}

                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowMapModal(true)} disabled={isRegisterLoading || !isLoaded}
                        className="input-form"
                      >
                        Mapa
                      </Button>
                    </InputGroup>
                  <div className="invalid-feedback" style={{display: fieldInvalid("address") ? "block" : "none"}}>{registerFieldErrors.address}</div></Form.Group>
                </div>
              </div>

              <section className="account-auth"><h2>Datos de tu cuenta</h2>              <div>
                <Form.Group controlId="registerEmail">
                  <Form.Label className="auth-label">Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email" autoComplete="email" inputMode="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    disabled={isRegisterLoading}
                    isInvalid={emailServerError || fieldInvalid("email")}
                    aria-describedby="registerEmailFeedback"
                    className="input-form"
                  />
                  <Form.Control.Feedback
                    type="invalid"
                    id="registerEmailFeedback"
                  >
                    {emailServerError ? "Ese email ya tiene una cuenta. Iniciá sesión o recuperá tu contraseña." : registerFieldErrors.email || "Revisá el email."}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div>
                <Form.Group controlId="registerDNI">
                  <Form.Label className="auth-label">DNI</Form.Label>
                  <Form.Control
                    type="text"
                    name="dni" autoComplete="off" inputMode="numeric" maxLength={8} pattern="[0-9]{8}"
                    placeholder="DNI"
                    value={registerData.dni}
                    onChange={handleRegisterChange}
                    required
                    disabled={isRegisterLoading}
                    isInvalid={dniServerError || fieldInvalid("dni")}
                    aria-describedby="registerDNIFeedback"
                    className="input-form"
                    minLength={8}
                  />
                  <Form.Control.Feedback
                    type="invalid"
                    id="registerDNIFeedback"
                  >
                    {dniServerError ? "El DNI ya está registrado. Iniciá sesión o recuperá tu contraseña; no uses otro DNI." : registerFieldErrors.dni || "Revisá el DNI."}
                  </Form.Control.Feedback>
                <small className="auth-help">Usamos tu DNI para identificar tu cuenta y generar tu alias de transferencias.</small></Form.Group>
              </div>

              <div>
                <Form.Group controlId="registerPassword">
                  <Form.Label className="auth-label">Contraseña</Form.Label>
                  <Form.Control
                    type={showRegisterPassword ? "text" : "password"}
                    name="password" autoComplete="new-password" minLength={8} pattern={HTML_PASSWORD_PATTERN} isInvalid={fieldInvalid("password")}
                    placeholder="Contraseña"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    disabled={isRegisterLoading}
                    aria-describedby="registerPasswordFeedback"
                    className="input-form"
                  />
                  <Form.Control.Feedback
                    type="invalid"
                    id="registerPasswordFeedback"
                  >
                    {PASSWORD_HELP}
                  </Form.Control.Feedback>
                <ul className="password-checklist" aria-label="Requisitos de contraseña">{passwordRules(registerData.password).map((rule) => <li key={rule.label} data-ok={rule.ok}>{rule.ok ? "✓" : "○"} {rule.label}</li>)}</ul></Form.Group>
              </div>

              <div>
                <Form.Group controlId="registerConfirmPassword">
                  <Form.Label className="auth-label">
                    Confirmar contraseña
                  </Form.Label>
                  <Form.Control
                    type={showRegisterPassword ? "text" : "password"}
                    name="confirmPassword" autoComplete="new-password"
                    placeholder="Confirmar contraseña"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    disabled={isRegisterLoading}
                    isInvalid={
                      (registerValidated || registerTouched.confirmPassword) &&
                      registerData.password !== registerData.confirmPassword
                    }
                    aria-describedby="registerConfirmPasswordFeedback"
                    className="input-form"
                  />

                  <Form.Control.Feedback
                    type="invalid"
                    id="registerConfirmPasswordFeedback"
                  >
                    Las contraseñas no coinciden.
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <Form.Group controlId="registerShowPassword">
                <Form.Check
                  type="checkbox"
                  label="Mostrar contraseña"
                  checked={showRegisterPassword}
                  onChange={(e) => setShowRegisterPassword(e.target.checked)}
                  disabled={isRegisterLoading}
                />
              </Form.Group>

              </section>
<div className="buttons-container">
                <div
                  onClick={() => {
                    if (showLogin) {
                      navigate(-1);
                    } else {
                      setShowRegister(false);
                      setShowLogin(true);
                    }
                  }}
                  className="back-btn"
                >
                  <p>
                    <BackIcon /> Volver
                  </p>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isRegisterLoading}
                  className="auth-btn"
                >
                  {isRegisterLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </div>
            </Form><WhatsAppOrder />
          </div>
        </div>
      </div>

      <div className={showLogin ? "right-container" : "hidden-login"}>
        <div id="login-register-div" className="login-register-div">
          <div className="div-login-container">
            <div className="logo-container"><img src={Logo} alt="Distrolac" className="distro-logo-login" /></div><h1 className="title-auth">Qué bueno verte de nuevo</h1><p className="auth-intro">Ingresá a tu cuenta para continuar. Tu carrito sigue guardado.</p>
            <hr className="red-line-login" />
            {error && <Alert variant="danger">{error}</Alert>}

            <Form
              noValidate
              validated={validated}
              onSubmit={handleLogin}
              className="login-form "
            >
              <Form.Group controlId="loginEmail">
                <Form.Label className="auth-label">Email o usuario</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Email o usuario"
                  autoComplete="username" value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  disabled={isLoginLoading}
                  className="input-form"
                />
              </Form.Group>

              <Form.Group controlId="loginPassword">
                <Form.Label className="auth-label">Contraseña</Form.Label>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoginLoading}
                  className="input-form"
                />
              </Form.Group>

              <Form.Group controlId="loginShowPassword">
                <Form.Check
                  type="checkbox"
                  label="Mostrar contraseña"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={isLoginLoading}
                />
              </Form.Group>

              <div className="forgot-password-container">
                <a
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail("");
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotEmailValid(true);
                  }}
                  className="forgot-password-link"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <div className="login-button-container">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoginLoading}
                  className="auth-btn"
                >
                  {isLoginLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>

              <div className="button-register-container">
                <hr className="red-line-login" />
                <p className="register-invitation">¿Es tu primera compra?</p><button type="button"
                  onClick={() => {
                    setShowRegister(true);
                    setShowLogin(false);
                  }}
                  className="button-register"
                >
                  Creá tu cuenta
                </button>
              </div>
            </Form><WhatsAppOrder />
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Recuperar Contraseña</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="forgot-modal-text">
            Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </p>

          {forgotError && (
            <Alert variant="danger">{forgotError}</Alert>
          )}
          {forgotSuccess && (
            <Alert variant="success">{forgotSuccess}</Alert>
          )}

          <Form onSubmit={handleForgotPassword}>
            <Form.Group controlId="forgotEmail">
              <Form.Label className="auth-label">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingresa tu email"
                value={forgotEmail}
                onChange={handleForgotEmailChange}
                isInvalid={!forgotEmailValid && forgotEmail !== ""}
                disabled={isForgotLoading || !!forgotSuccess}
                className="input-form"
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                Ingrese un email válido.
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowForgotModal(false)}
            disabled={isForgotLoading}
          >
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={handleForgotPassword}
            disabled={isForgotLoading || !!forgotSuccess}
            className="auth-btn"
          >
            {isForgotLoading ? "Enviando..." : "Enviar"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Selecciona tu ubicación</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Autocomplete
            onLoad={(instance) => setModalAutocomplete(instance)}
            onPlaceChanged={() => {
              if (!modalAutocomplete) return;
              const place = modalAutocomplete.getPlace();
              if (place.geometry && place.geometry.location && map && marker) {
                map.setCenter(place.geometry.location);
                marker.setPosition(place.geometry.location);
                setRegisterData((prev) => ({
                  ...prev,
                  address: place.formatted_address || prev.address,
                }));
              }
            }}
          >
            <Form.Control type="text" placeholder="Buscar dirección..." />
          </Autocomplete>

          <div
            ref={mapRef}
            style={{
              height: "400px",
              width: "100%",
              backgroundColor: "#e0e0e0",
            }}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowMapModal(false)}>
            Confirmar Ubicación
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Login;
