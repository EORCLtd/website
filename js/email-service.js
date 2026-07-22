/**
 * EORC — email service abstraction
 * ---------------------------------------------------------------
 * Every form on the site calls EmailService.send(formType, data).
 * Delivery is handled client-side via the EmailJS SDK — no server
 * code needed. Setup:
 *
 *   1. Create a free account at https://www.emailjs.com/
 *   2. Connect an email service and create a template for the
 *      contact form (see README.md)
 *   3. Fill in EMAILJS_CONFIG below and the emailjs.init(...) call
 *      in contact.html
 * ---------------------------------------------------------------
 */
const EmailService = (() => {

  const EMAILJS_CONFIG = {
    publicKey:  'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId:  'YOUR_EMAILJS_SERVICE_ID',
    templateIds: {
      contact: 'YOUR_CONTACT_TEMPLATE_ID'
    }
  };

  /**
   * @param {string} formType - 'contact'
   * @param {object} data - plain key/value form fields
   */
  async function send(formType, data) {
    if (typeof emailjs === 'undefined') {
      throw new Error(
        'EmailJS SDK not found. Add the EmailJS script to the HTML ' +
        '(see README.md).'
      );
    }
    const templateId = EMAILJS_CONFIG.templateIds[formType];
    if (!templateId) {
      throw new Error(`No EmailJS template configured for the "${formType}" form.`);
    }
    return emailjs.send(EMAILJS_CONFIG.serviceId, templateId, data, EMAILJS_CONFIG.publicKey);
  }

  return { send };
})();
