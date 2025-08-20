import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-primary text-text-dark p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-semibold">
                    OnlyWorlds Browse Tool Guide
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 hover:bg-primary-dark transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6 text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                  {/* Overview */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">What is the Browse Tool?</h3>
                    <p className="text-text-dark/80">
                      The Browse Tool is your advanced viewer and editor for OnlyWorlds data. It allows you to explore your world's elements, 
                      visualize relationships between them, and make edits with a sophisticated interface designed for world builders.
                    </p>
                  </section>

                  {/* Getting Started */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                    <ol className="list-decimal list-inside space-y-2 text-text-dark/80">
                      <li>Enter your 10-digit API key and 4-digit PIN in the top bar</li>
                      <li>Click "validate" to load your world</li>
                      <li>Browse elements by category in the left sidebar</li>
                      <li>Click any element to view its details</li>
                    </ol>
                  </section>

                  {/* Key Features */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-1">📊 Network Visualization</h4>
                        <p className="text-text-dark/80 dark:text-gray-400 text-xs ml-6">
                          See relationships between elements as an interactive graph. Adjust depth (1-5) to control how many connections to show.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">✏️ Edit Mode</h4>
                        <p className="text-text-dark/80 dark:text-gray-400 text-xs ml-6">
                          Toggle edit mode with the button or press 'E'. Click any field to edit it. Changes are highlighted until saved.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">🔗 Smart Linking</h4>
                        <p className="text-text-dark/80 dark:text-gray-400 text-xs ml-6">
                          Link fields show related elements. Click links to navigate. Multi-link fields support adding/removing multiple connections.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">🔄 Reverse Relationships</h4>
                        <p className="text-text-dark/80 dark:text-gray-400 text-xs ml-6">
                          See which elements link TO the current element in the reverse relations panel.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">📤 Export & Share</h4>
                        <p className="text-text-dark/80 dark:text-gray-400 text-xs ml-6">
                          Export elements to PDF or publish showcase URLs for public sharing.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Interface Guide */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Interface Guide</h3>
                    <div className="space-y-2 text-text-dark/80">
                      <p><strong>Left Sidebar:</strong> Categories and elements. Use search to filter.</p>
                      <p><strong>Center Panel:</strong> Element details and network view.</p>
                      <p><strong>Right Panel:</strong> Edit area (when in edit mode) or reverse relations.</p>
                      <p><strong>Top Bar:</strong> Authentication, save controls, and world name.</p>
                    </div>
                  </section>

                  {/* Keyboard Shortcuts */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2 text-text-dark/80">
                      <div><kbd className="px-2 py-1 bg-primary-dark rounded text-xs">E</kbd> Toggle edit mode</div>
                      <div><kbd className="px-2 py-1 bg-primary-dark rounded text-xs">Ctrl+S</kbd> Save all changes</div>
                      <div><kbd className="px-2 py-1 bg-primary-dark rounded text-xs">N</kbd> New element</div>
                      <div><kbd className="px-2 py-1 bg-primary-dark rounded text-xs">Esc</kbd> Cancel editing</div>
                    </div>
                  </section>

                  {/* Tips */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Pro Tips</h3>
                    <ul className="list-disc list-inside space-y-1 text-text-dark/80 text-xs">
                      <li>Use the options menu (⋮) to hide empty fields or sort alphabetically</li>
                      <li>Drag nodes in the network view to rearrange the layout</li>
                      <li>Double-click nodes in the network to navigate to that element</li>
                      <li>Hold Shift while clicking links to open in edit mode</li>
                      <li>Use showcase mode to share read-only views with players</li>
                    </ul>
                  </section>

                  {/* About OnlyWorlds */}
                  <section className="border-t border-primary-dark pt-4">
                    <h3 className="text-lg font-semibold mb-2">About OnlyWorlds</h3>
                    <p className="text-text-dark/80 text-xs">
                      OnlyWorlds is an open standard for portable world-building data. Your worlds can flow between different tools 
                      and applications. Visit <a href="https://onlyworlds.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">onlyworlds.com</a> to 
                      learn more or explore other tools in the ecosystem.
                    </p>
                  </section>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-text-dark rounded text-sm transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}