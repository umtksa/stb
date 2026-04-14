document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    const titleInput = document.getElementById('titleInput');
    const scriptInput = document.getElementById('scriptInput');
    const previewArea = document.getElementById('previewArea');
    const exportBtn = document.getElementById('exportBtn');

    let title = '';
    let script = '';
    let frames = [];
    let pages = [[]];

    function updateState() {
        title = titleInput.value;
        script = scriptInput.value;

        // Split script by '---', trim whitespace, and remove empty frames
        frames = script.split('---').map(s => s.trim()).filter(s => s.length > 0);
        
        // Group frames into pages of 6
        pages = [];
        for (let i = 0; i < frames.length; i += 6) {
            pages.push(frames.slice(i, i + 6));
        }
        
        // Ensure at least one empty page is shown if there's no content
        if (pages.length === 0) {
            pages.push([]);
        }

        renderPreview();
    }

    function renderPreview() {
        // Clear current preview
        previewArea.innerHTML = '';

        pages.forEach((pageFrames, pageIndex) => {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'flex flex-col items-center';

            const slideDiv = document.createElement('div');
            slideDiv.className = 'bg-[#ffffff] relative';
            slideDiv.style.width = '960px';
            slideDiv.style.height = '540px';
            slideDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
            slideDiv.style.padding = '45px';

            // Title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'absolute top-[30px] left-[45px] text-[16px] font-bold text-[#000000] truncate max-w-[800px]';
            titleDiv.textContent = title || 'Title';
            slideDiv.appendChild(titleDiv);

            // Grid
            const gridDiv = document.createElement('div');
            gridDiv.className = 'mt-[40px] grid grid-cols-3 grid-rows-2 gap-[24px] h-[calc(100%-60px)]';

            // Render filled frames
            pageFrames.forEach((frameText, frameIndex) => {
                const frameDiv = createFrameElement(pageIndex * 6 + frameIndex + 1, frameText, false);
                gridDiv.appendChild(frameDiv);
            });

            // Render empty slots (up to 6 per page)
            const emptyCount = 6 - pageFrames.length;
            for (let i = 0; i < emptyCount; i++) {
                const frameDiv = createFrameElement(pageIndex * 6 + pageFrames.length + i + 1, '', true);
                gridDiv.appendChild(frameDiv);
            }

            slideDiv.appendChild(gridDiv);
            pageContainer.appendChild(slideDiv);

            // Page Number
            const pageNumDiv = document.createElement('div');
            pageNumDiv.className = 'mt-5 text-[12px] text-[#64748b]';
            pageNumDiv.textContent = `Page ${pageIndex + 1} of ${pages.length} (Slide Preview)`;
            pageContainer.appendChild(pageNumDiv);

            previewArea.appendChild(pageContainer);
        });
    }

    function createFrameElement(frameNumber, text, isEmpty) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col gap-[8px] ${isEmpty ? 'opacity-40' : ''}`;

        const imgPlaceholder = document.createElement('div');
        imgPlaceholder.className = 'w-full h-[90px] shrink-0 border border-[#d1d5db] bg-[#e2e8f0] flex items-center justify-center text-[#94a3b8] text-[11px] font-medium';
        imgPlaceholder.textContent = `FRAME ${String(frameNumber).padStart(2, '0')}`;

        const textDiv = document.createElement('div');
        textDiv.className = 'text-[7.5px] leading-[1.5] text-[#334155] flex-1 overflow-hidden border-t border-[#f1f5f9] pt-[6px]';
        textDiv.textContent = text;

        wrapper.appendChild(imgPlaceholder);
        wrapper.appendChild(textDiv);

        return wrapper;
    }

    async function exportPPTX() {
        // PptxGenJS is available globally via the CDN script
        const pptx = new PptxGenJS();
        pptx.defineLayout({ name: 'FHD', width: 1920 / 72, height: 1080 / 72 });
        pptx.layout = 'FHD';

        // Generate a 1920x1080 gray PNG for the image placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#e2e8f0'; // gray-200
            ctx.fillRect(0, 0, 1920, 1080);
        }
        const placeholderBase64 = canvas.toDataURL('image/png');

        pages.forEach((pageFrames, pageIndex) => {
            const slide = pptx.addSlide();

            // Add Title
            slide.addText(title, {
                x: 1.6,
                y: 1.5,
                w: 24.0,
                h: 0.6,
                fontSize: 14,
                bold: true,
                fontFace: 'Arial',
                color: '000000',
                valign: 'top',
            });

            // Grid Layout settings
            const startX = 1.6;
            const startY = 2.5;
            const colWidth = 6.93;
            const imgHeight = 3.9;
            const gapX = 1.33;
            const gapY = 0.6;
            const textOffset = 0.2;
            const textHeight = 1.8;

            pageFrames.forEach((frameText, frameIndex) => {
                const col = frameIndex % 3;
                const row = Math.floor(frameIndex / 3);

                const x = startX + col * (colWidth + gapX);
                const y = startY + row * (imgHeight + textOffset + textHeight + gapY);

                // Image Placeholder (1920x1080 PNG)
                slide.addImage({
                    data: placeholderBase64,
                    x: x,
                    y: y,
                    w: colWidth,
                    h: imgHeight,
                });

                // Frame Text
                slide.addText(frameText, {
                    x: x,
                    y: y + imgHeight + textOffset,
                    w: colWidth,
                    h: textHeight,
                    fontSize: 14,
                    fontFace: 'Arial',
                    color: '000000',
                    valign: 'top',
                    wrap: true,
                });
            });
        });

        pptx.writeFile({ fileName: `${title || 'Storyboard'}.pptx` });
    }

    // Event Listeners
    titleInput.addEventListener('input', updateState);
    scriptInput.addEventListener('input', updateState);
    exportBtn.addEventListener('click', exportPPTX);

    // Initial render
    updateState();
});
